import { LRUCache } from 'lru-cache';
import { HttpClient } from '../http/http-client';
import { AugmentedTokenClaims } from '../types';

export interface TenantProfile {
  tenantId: string;
  residency: string;
}

export interface ConfigServiceClientOptions {
  baseUrl: string;
  cacheTtlMs?: number;
}

/**
 * Pulls authoritative tenant metadata from the config service. Downstream
 * authorization rules rely on this enriched data to reason about regional
 * residency and data localization compliance.
 */
export class TenantClaimsEnricher {
  private readonly cache: LRUCache<string, TenantProfile>;

  constructor(private readonly httpClient: HttpClient, private readonly options: ConfigServiceClientOptions) {
    this.cache = new LRUCache({ max: 500, ttl: options.cacheTtlMs ?? 15 * 60 * 1000 });
  }

  private async fetchProfile(tenantId: string): Promise<TenantProfile> {
    const url = `${this.options.baseUrl.replace(/\/$/, '')}/tenants/${tenantId}`;
    return this.httpClient.getJson<TenantProfile>(url);
  }

  async enrichClaims(
    payload: Record<string, unknown>,
    defaults: { fallbackTenant: string; fallbackResidency: string },
  ): Promise<AugmentedTokenClaims> {
    const tenantId = (payload['tenant_id'] as string) ?? defaults.fallbackTenant;
    const cached = this.cache.get(tenantId) ?? (await this.fetchProfile(tenantId));
    this.cache.set(tenantId, cached);

    const impersonation = payload['act'] as { sub?: string; txn?: string } | undefined;

    return {
      issuer: String(payload['iss'] ?? ''),
      subject: String(payload['sub'] ?? ''),
      authorizedParty: (payload['azp'] as string) ?? (payload['client_id'] as string) ?? undefined,
      audiences: Array.isArray(payload['aud']) ? (payload['aud'] as string[]) : [String(payload['aud'])],
      audience: Array.isArray(payload['aud']) ? String((payload['aud'] as string[])[0]) : String(payload['aud']),
      expiresAt: Number(payload['exp'] ?? 0),
      notBefore: payload['nbf'] ? Number(payload['nbf']) : undefined,
      tenantId: cached.tenantId,
      residency: cached.residency ?? defaults.fallbackResidency,
      impersonator:
        impersonation && impersonation.sub
          ? {
              subject: impersonation.sub,
              reason:
                typeof payload['impersonation_reason'] === 'string'
                  ? (payload['impersonation_reason'] as string)
                  : 'unspecified',
            }
          : undefined,
      rawPayload: payload,
    };
  }
}
