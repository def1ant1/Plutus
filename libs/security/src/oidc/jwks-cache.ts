import { LRUCache } from 'lru-cache';
import { createLocalJWKSet, JWTPayload, jwtVerify } from 'jose';
import { HttpClient } from '../http/http-client';

export interface JwksCacheOptions {
  cacheTtlMs?: number;
}

interface CachedKeySet {
  jwks: ReturnType<typeof createLocalJWKSet>;
  expiresAt: number;
}

export interface TokenValidationResult {
  payload: JWTPayload;
  protectedHeader: Record<string, unknown>;
}

/**
 * JWKS cache keyed by the remote JWKS URI. We reuse the JWKSet function across
 * invocations so repeated `jwtVerify` calls do not reparse the key material.
 */
export class RemoteJwksCache {
  private readonly cache: LRUCache<string, CachedKeySet>;

  constructor(
    private readonly httpClient: HttpClient,
    options?: JwksCacheOptions,
  ) {
    this.cache = new LRUCache({
      max: 100,
      ttl: options?.cacheTtlMs ?? 5 * 60 * 1000,
    });
  }

  private async fetchJwks(jwksUri: string): Promise<CachedKeySet> {
    const jwksJson = await this.httpClient.getJson<{ keys: unknown[] }>(jwksUri);
    const jwks = createLocalJWKSet(jwksJson as never);
    return {
      jwks,
      expiresAt: Date.now() + (this.cache.ttl ?? 5 * 60 * 1000),
    };
  }

  private async getOrCreate(jwksUri: string): Promise<CachedKeySet> {
    const cached = this.cache.get(jwksUri);
    if (cached && cached.expiresAt > Date.now()) {
      return cached;
    }

    const resolved = await this.fetchJwks(jwksUri);
    this.cache.set(jwksUri, resolved);
    return resolved;
  }

  async validateJwt(
    token: string,
    jwksUri: string,
    options: {
      issuer: string;
      audience: string;
    },
  ): Promise<TokenValidationResult> {
    const { jwks } = await this.getOrCreate(jwksUri);
    const { payload, protectedHeader } = await jwtVerify(token, jwks, {
      audience: options.audience,
      issuer: options.issuer,
    });

    return { payload, protectedHeader };
  }
}
