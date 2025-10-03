import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { HttpClient } from '../http/http-client';
import { TokenValidator } from '../oidc/token-validator';

class FakeHttpClient extends HttpClient {
  constructor(private readonly responses: Record<string, unknown>, private readonly calls: Record<string, number>) {
    super();
  }

  override async getJson<T>(url: string): Promise<T> {
    this.calls[url] = (this.calls[url] ?? 0) + 1;
    if (!(url in this.responses)) {
      throw new Error(`Unexpected URL ${url}`);
    }
    return this.responses[url] as T;
  }
}

const ISSUER = 'https://idp.example.com/';
const JWKS_URI = 'https://idp.example.com/keys';
const AUDIENCE = 'api://plutus';

describe('TokenValidator', () => {
  it('validates RS256 tokens via discovered JWKS and caches responses', async () => {
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    const jwk = await exportJWK(publicKey);
    jwk.kid = 'test-key';
    jwk.use = 'sig';
    jwk.alg = 'RS256';

    const token = await new SignJWT({ sub: 'user-123', aud: AUDIENCE, iss: ISSUER })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key', typ: 'JWT' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);

    const responses = {
      [`${ISSUER}.well-known/openid-configuration`]: {
        issuer: ISSUER,
        jwks_uri: JWKS_URI,
        token_endpoint: `${ISSUER}oauth/token`,
        authorization_endpoint: `${ISSUER}authorize`,
      },
      [JWKS_URI]: { keys: [jwk] },
    } satisfies Record<string, unknown>;

    const calls: Record<string, number> = {};
    const httpClient = new FakeHttpClient(responses, calls);
    const validator = new TokenValidator(httpClient);

    const first = await validator.validate(token, { issuer: ISSUER, audience: AUDIENCE });
    expect(first.payload.sub).toEqual('user-123');

    const second = await validator.validate(token, { issuer: ISSUER, audience: AUDIENCE });
    expect(second.payload.sub).toEqual('user-123');

    expect(calls[`${ISSUER}.well-known/openid-configuration`]).toBe(1);
    expect(calls[JWKS_URI]).toBe(1);
  });
});
