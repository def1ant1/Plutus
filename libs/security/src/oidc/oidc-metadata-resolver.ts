import { LRUCache } from 'lru-cache';
import { HttpClient } from '../http/http-client';

export interface OidcDiscoveryDocument {
  issuer: string;
  jwks_uri: string;
  token_endpoint: string;
  authorization_endpoint: string;
}

export interface OidcMetadataResolverOptions {
  /** TTL in milliseconds for caching discovery documents. Defaults to 10m. */
  cacheTtlMs?: number;
}

/**
 * Responsible for retrieving and caching OIDC discovery documents for issuers
 * such as Auth0 or Azure AD. We cache aggressively to avoid hammering the
 * identity providers and to ensure cold-starts remain fast during traffic
 * spikes.
 */
export class OidcMetadataResolver {
  private readonly cache: LRUCache<string, OidcDiscoveryDocument>;

  constructor(
    private readonly httpClient: HttpClient,
    options?: OidcMetadataResolverOptions,
  ) {
    this.cache = new LRUCache({
      max: 100,
      ttl: options?.cacheTtlMs ?? 10 * 60 * 1000,
    });
  }

  async resolve(issuer: string): Promise<OidcDiscoveryDocument> {
    const cached = this.cache.get(issuer);
    if (cached) {
      return cached;
    }

    const url = new URL('.well-known/openid-configuration', issuer).toString();
    const discovery = await this.httpClient.getJson<OidcDiscoveryDocument>(url);
    this.cache.set(issuer, discovery);
    return discovery;
  }
}
