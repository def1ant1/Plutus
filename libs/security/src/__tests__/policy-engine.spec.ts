import path from 'node:path';
import { PolicyEngine } from '../policy/policy-engine';
import { AccessRequestContext } from '../types';

describe('PolicyEngine', () => {
  const bundlePath = path.join(__dirname, '..', 'policy', '__fixtures__', 'iam.policy.json');

  it('allows tenants.create for us residency admins', async () => {
    const engine = new PolicyEngine({ bundlePath, hotReload: true });
    const context: AccessRequestContext = {
      action: 'iam.tenants.create',
      claims: {
        issuer: 'https://idp.example.com/',
        subject: 'user-123',
        audiences: ['api://plutus'],
        audience: 'api://plutus',
        expiresAt: Math.floor(Date.now() / 1000) + 60,
        tenantId: 'tenant-1',
        residency: 'us',
        rawPayload: { roles: ['iam.admin'] },
      },
      resource: {},
      environment: {},
    };

    const decision = await engine.evaluate(context);
    expect(decision.allow).toBe(true);
  });

  it('denies tenants.create when residency mismatches policy requirements', async () => {
    const engine = new PolicyEngine({ bundlePath, hotReload: true });
    const context: AccessRequestContext = {
      action: 'iam.tenants.create',
      claims: {
        issuer: 'https://idp.example.com/',
        subject: 'user-123',
        audiences: ['api://plutus'],
        audience: 'api://plutus',
        expiresAt: Math.floor(Date.now() / 1000) + 60,
        tenantId: 'tenant-1',
        residency: 'eu',
        rawPayload: { roles: ['iam.admin'] },
      },
      resource: {},
      environment: {},
    };

    const decision = await engine.evaluate(context);
    expect(decision.allow).toBe(false);
    expect(decision.reasons).toContain('tenant_creation_requires_us_residency');
  });

  it('requires at least one privileged role for key rotation', async () => {
    const engine = new PolicyEngine({ bundlePath, hotReload: true });
    const context: AccessRequestContext = {
      action: 'iam.keys.rotate',
      claims: {
        issuer: 'https://idp.example.com/',
        subject: 'user-456',
        audiences: ['api://plutus'],
        audience: 'api://plutus',
        expiresAt: Math.floor(Date.now() / 1000) + 60,
        tenantId: 'tenant-1',
        residency: 'us',
        rawPayload: { roles: ['iam.operator'] },
      },
      resource: { rotationType: 'standard' },
      environment: {},
    };

    const decision = await engine.evaluate(context);
    expect(decision.allow).toBe(true);
  });
});
