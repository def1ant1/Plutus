import { JWTPayload } from 'jose';
import { HttpClient } from '../http/http-client';
import {
  OidcMetadataResolver,
  OidcMetadataResolverOptions,
} from './oidc-metadata-resolver';
import { RemoteJwksCache } from './jwks-cache';

export interface TokenValidatorOptions {
  discovery?: OidcMetadataResolverOptions;
  jwks?: { cacheTtlMs?: number };
}

export interface ValidatedToken {
  payload: JWTPayload;
  protectedHeader: Record<string, unknown>;
}

/**
 * High-level orchestrator that discovers metadata, fetches JWKS, and verifies
 * JWTs in a single cohesive unit.
 */
export class TokenValidator {
  private readonly metadataResolver: OidcMetadataResolver;
  private readonly jwksCache: RemoteJwksCache;

  constructor(private readonly httpClient: HttpClient, options?: TokenValidatorOptions) {
    this.metadataResolver = new OidcMetadataResolver(httpClient, options?.discovery);
    this.jwksCache = new RemoteJwksCache(httpClient, options?.jwks);
  }

  async validate(
    token: string,
    options: {
      issuer: string;
      audience: string;
    },
  ): Promise<ValidatedToken> {
    const discovery = await this.metadataResolver.resolve(options.issuer);
    const result = await this.jwksCache.validateJwt(token, discovery.jwks_uri, options);
    return result;
  }
}
