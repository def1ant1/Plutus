import { FastifyReply, FastifyRequest } from 'fastify';
import { HttpClient } from '../http/http-client';
import { TenantClaimsEnricher, ConfigServiceClientOptions } from '../claims/tenant-claims-enricher';
import { TokenValidator, TokenValidatorOptions } from '../oidc/token-validator';
import { PolicyEngine } from '../policy/policy-engine';
import { AccessDecision, AccessRequestContext, AugmentedTokenClaims } from '../types';

export interface AuthenticationMiddlewareOptions {
  issuer: string;
  audience: string;
  configService: ConfigServiceClientOptions;
  tokenValidator?: TokenValidatorOptions;
  policyBundlePath: string;
  defaultTenant: string;
  defaultResidency: string;
}

export interface AuthenticatedRequest extends FastifyRequest {
  auth?: {
    claims: AugmentedTokenClaims;
    decision: AccessDecision;
  };
}

/**
 * Fastify/Nest compatible preHandler that validates bearer tokens, enriches the
 * claims bag with tenant + residency data, and produces a policy decision using
 * the embedded bundle. Downstream handlers can rely on `request.auth` to gate
 * behavior without reimplementing boilerplate.
 */
export class AuthenticationMiddleware {
  private readonly tokenValidator: TokenValidator;
  private readonly claimsEnricher: TenantClaimsEnricher;
  private readonly policyEngine: PolicyEngine;

  constructor(private readonly options: AuthenticationMiddlewareOptions) {
    const httpClient = new HttpClient();
    this.tokenValidator = new TokenValidator(httpClient, options.tokenValidator);
    this.claimsEnricher = new TenantClaimsEnricher(httpClient, options.configService);
    this.policyEngine = new PolicyEngine({ bundlePath: options.policyBundlePath });
  }

  handler = async (request: AuthenticatedRequest, reply: FastifyReply): Promise<void> => {
    const token = this.extractBearer(request);
    if (!token) {
      reply.code(401).send({ error: 'missing_authorization_header' });
      return;
    }

    try {
      const validated = await this.tokenValidator.validate(token, {
        issuer: this.options.issuer,
        audience: this.options.audience,
      });
      const claims = await this.claimsEnricher.enrichClaims(validated.payload, {
        fallbackTenant: this.options.defaultTenant,
        fallbackResidency: this.options.defaultResidency,
      });

      const decision = await this.policyEngine.evaluate(this.buildContext(request, claims));

      request.auth = { claims, decision };
      if (!decision.allow) {
        reply.code(403).send({ error: 'access_denied', reasons: decision.reasons, remediation: decision.remediation });
        return;
      }
    } catch (error) {
      reply.code(401).send({ error: 'token_validation_failed', message: (error as Error).message });
    }
  };

  private extractBearer(request: FastifyRequest): string | null {
    const header = request.headers['authorization'] ?? request.headers['Authorization'];
    if (!header || Array.isArray(header)) {
      return null;
    }
    const [scheme, value] = header.split(' ');
    if (!scheme || scheme.toLowerCase() !== 'bearer' || !value) {
      return null;
    }
    return value.trim();
  }

  private buildContext(request: FastifyRequest, claims: AugmentedTokenClaims): AccessRequestContext {
    return {
      claims,
      action: request.routeOptions?.config?.action ?? 'unknown',
      resource: request.body && typeof request.body === 'object' ? (request.body as Record<string, unknown>) : {},
      environment: {
        method: request.method,
        ip: request.ip,
        path: request.url,
        residency: claims.residency,
      },
    };
  }
}
