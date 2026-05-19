import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

interface VerifiedIdToken {
  subject: string;
  email?: string;
  name?: string;
  emailVerified?: boolean;
}

interface ProviderConfig {
  issuer: string;
  jwksUri: string;
  audienceEnv: string;
}

const PROVIDERS: Record<'google' | 'apple', ProviderConfig> = {
  google: {
    issuer: 'https://accounts.google.com',
    jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
    audienceEnv: 'GOOGLE_CLIENT_ID',
  },
  apple: {
    issuer: 'https://appleid.apple.com',
    jwksUri: 'https://appleid.apple.com/auth/keys',
    audienceEnv: 'APPLE_CLIENT_ID',
  },
};

/**
 * Verifies OAuth id_tokens against the provider's JWKS, with the
 * audience pinned to our own client_id. There is no dev-trust bypass —
 * if the token can't be cryptographically verified, the request fails.
 */
@Injectable()
export class OAuthVerifierService {
  private readonly logger = new Logger(OAuthVerifierService.name);
  private readonly jwks: Record<'google' | 'apple', ReturnType<typeof createRemoteJWKSet>>;

  constructor(private readonly config: ConfigService) {
    this.jwks = {
      google: createRemoteJWKSet(new URL(PROVIDERS.google.jwksUri)),
      apple: createRemoteJWKSet(new URL(PROVIDERS.apple.jwksUri)),
    };
  }

  async verify(provider: 'google' | 'apple', idToken: string): Promise<VerifiedIdToken> {
    const cfg = PROVIDERS[provider];
    const audience = this.config.get<string>(cfg.audienceEnv);
    if (!audience) {
      throw new BadRequestException({
        code: 'oauth_audience_missing',
        message: `${cfg.audienceEnv} is not configured.`,
      });
    }
    try {
      const { payload } = await jwtVerify(idToken, this.jwks[provider], {
        issuer: cfg.issuer,
        audience,
      });
      const p = payload as JWTPayload & { sub?: string; email?: string; name?: string; email_verified?: boolean };
      if (!p.sub) {
        throw new BadRequestException({ code: 'oauth_no_subject', message: 'No subject in id_token.' });
      }
      return {
        subject: p.sub,
        email: typeof p.email === 'string' ? p.email : undefined,
        name: typeof p.name === 'string' ? p.name : undefined,
        emailVerified: typeof p.email_verified === 'boolean' ? p.email_verified : undefined,
      };
    } catch (e) {
      this.logger.warn(`OAuth verify failed (${provider}): ${(e as Error).message}`);
      throw new BadRequestException({
        code: 'oauth_invalid_token',
        message: 'OAuth id_token could not be verified.',
      });
    }
  }
}
