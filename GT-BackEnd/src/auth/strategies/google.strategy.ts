import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { EnvironmentVariables } from '../../config/env.validation';
import { DEFAULT_GOOGLE_CALLBACK_URL } from '../auth.constants';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService<EnvironmentVariables, true>,
    private readonly auth: AuthService,
  ) {
    super({
      clientID:
        config.get('GOOGLE_CLIENT_ID', { infer: true }) ?? 'not-configured',
      clientSecret:
        config.get('GOOGLE_CLIENT_SECRET', { infer: true }) ?? 'not-configured',
      callbackURL:
        config.get('GOOGLE_CALLBACK_URL', { infer: true }) ??
        DEFAULT_GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    return this.auth.upsertFromGoogle({
      googleId: profile.id,
      email,
      displayName: profile.displayName || email,
      avatarUrl: profile.photos?.[0]?.value ?? null,
    });
  }
}
