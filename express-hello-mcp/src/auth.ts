import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { OAuthTokenVerifier } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

async function discoverJwksUri(issuer: string): Promise<string> {
  const { origin, pathname } = new URL(issuer);
  const hasPath = pathname && pathname !== '/';

  const candidates = hasPath
    ? [
        `${origin}/.well-known/oauth-authorization-server${pathname}`,
        `${origin}/.well-known/openid-configuration${pathname}`,
        `${issuer}/.well-known/openid-configuration`,
      ]
    : [
        `${issuer}/.well-known/oauth-authorization-server`,
        `${issuer}/.well-known/openid-configuration`,
      ];

  for (const url of candidates) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const config = (await res.json()) as { jwks_uri?: string };
        if (config.jwks_uri) return config.jwks_uri;
      }
    } catch {
      // try next candidate
    }
  }

  throw new Error(`Cannot discover JWKS URI for issuer: ${issuer}`);
}

const JWK_REDISCOVERY_INTERVAL = 5 * 60 * 1000; // 5 minutes

export class JwtTokenVerifier implements OAuthTokenVerifier {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  private jwksDiscoveredAt = 0;

  constructor(private readonly issuer: string, private readonly audience: string) {}

  private async getJwks() {
    if (!this.jwks || Date.now() - this.jwksDiscoveredAt > JWK_REDISCOVERY_INTERVAL) {
      const jwksUri = await discoverJwksUri(this.issuer);
      this.jwks = createRemoteJWKSet(new URL(jwksUri));
      this.jwksDiscoveredAt = Date.now();
    }
    return this.jwks;
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const { payload } = await jwtVerify(token, await this.getJwks(), {
      issuer: this.issuer,
      audience: this.audience,
    });

    const scopes = ((payload['scope'] as string) ?? '').split(' ').filter(Boolean);
    const clientId = (payload['client_id'] ?? payload['azp'] ?? payload['sub'] ?? '') as string;

    return {
      token,
      clientId,
      scopes,
      expiresAt: payload.exp,
      resource: new URL(this.audience),
    };
  }
}
