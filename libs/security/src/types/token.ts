/**
 * Domain-specific claims enriched after validating an ID or access token. The
 * structure intentionally mirrors what downstream services expect so the
 * middleware can be plugged into Fastify, Express, or raw Nest contexts without
 * leaking framework-specific types.
 */
export interface AugmentedTokenClaims {
  /** Issuer (`iss`) that minted the JWT. */
  issuer: string;
  /** Subject (`sub`) representing the human or workload identity. */
  subject: string;
  /** Client/application identifier (`azp` or `client_id`). */
  authorizedParty?: string;
  /**
   * RFC 7519 audience(s) allowed to consume the token. We preserve the raw
   * array for traceability while also exposing a normalized primary audience.
   */
  audiences: string[];
  /** Primary audience enforced during verification. */
  audience: string;
  /** Epoch second when the token expires. */
  expiresAt: number;
  /** Epoch second when the token becomes valid. */
  notBefore?: number;
  /** Tenant identifier resolved from the token or config-svc. */
  tenantId: string;
  /** Residency jurisdiction (e.g. `us`, `eu`). */
  residency: string;
  /** Optional operator initiating an impersonation workflow. */
  impersonator?: {
    /** The identity performing the action on behalf of another subject. */
    subject: string;
    /** Business justification captured for compliance review. */
    reason: string;
  };
  /** raw, verified payload for downstream auditing/debugging. */
  rawPayload: Record<string, unknown>;
}

/**
 * The contextual input provided to the policy engine. Both RBAC (role based
 * access control) and ABAC (attribute based access control) checks run on the
 * same structure to keep authorization semantics centralized.
 */
export interface AccessRequestContext {
  /**
   * Consolidated claims derived from the JWT and configuration service. These
   * are the inputs our Rego policies evaluate.
   */
  claims: AugmentedTokenClaims;
  /** Operation that the caller wants to perform (e.g. `iam.tenants.create`). */
  action: string;
  /** Arbitrary resource attributes gathered by the caller. */
  resource: Record<string, unknown>;
  /**
   * Environmental attributes such as request IP, region, or compliance regime.
   * ABAC rules heavily rely on these knobs, so we keep the bag extensible.
   */
  environment: Record<string, unknown>;
}

/** Result coming back from the policy engine. */
export interface AccessDecision {
  /** Whether the request is allowed. */
  allow: boolean;
  /** Optional machine-readable denial reasons. */
  reasons?: string[];
  /** Optional remediation hints bubbled up from policy metadata. */
  remediation?: string[];
}
