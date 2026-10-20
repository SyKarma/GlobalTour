import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions } from 'express';
import { EnvironmentVariables } from '../config/env.validation';
import { User } from '../database/entities/user.entity';
import { createOriginChecker } from '../common/allowed-origins';
import {
  AUTH_COOKIE_MAX_AGE_MS,
  AUTH_COOKIE_NAME,
  AUTH_RETURN_COOKIE_MAX_AGE_MS,
} from './auth.constants';
import {
  GoogleProfileInput,
  JwtPayload,
  PublicUser,
  toPublicUser,
} from './auth.types';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  isConfigured(): boolean {
    return (
      this.hasValue(this.config.get('GOOGLE_CLIENT_ID', { infer: true })) &&
      this.hasValue(this.config.get('GOOGLE_CLIENT_SECRET', { infer: true }))
    );
  }

  assertConfigured(): void {
    if (!this.isConfigured()) {
      throw new ServiceUnavailableException(
        'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      );
    }
  }

  upsertFromGoogle(profile: GoogleProfileInput): Promise<User> {
    return this.users.upsertFromGoogle(profile);
  }

  signToken(user: User): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwt.sign(payload);
  }

  cookieName(): string {
    return AUTH_COOKIE_NAME;
  }

  cookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      httpOnly: true,
      sameSite: isProduction ? 'none' : 'lax',
      secure: isProduction,
      path: '/',
      maxAge: AUTH_COOKIE_MAX_AGE_MS,
    };
  }

  returnCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/api/auth',
      maxAge: AUTH_RETURN_COOKIE_MAX_AGE_MS,
    };
  }

  /**
   * Accepts the page the login started from only if it belongs to an
   * allowed frontend (same list as CORS), so the redirect cannot be abused.
   */
  safeReturnTo(returnTo: unknown): string | null {
    if (typeof returnTo !== 'string' || returnTo.length > 2048) {
      return null;
    }

    try {
      const url = new URL(returnTo);
      const isAllowed = createOriginChecker({
        corsOrigin: this.config.get('CORS_ORIGIN', { infer: true }),
        frontendUrl: this.config.get('FRONTEND_URL', { infer: true }),
        isProduction: process.env.NODE_ENV === 'production',
      });
      return isAllowed(url.origin) ? url.toString() : null;
    } catch {
      return null;
    }
  }

  frontendRedirectUrl(returnTo?: unknown): string {
    const safe = this.safeReturnTo(returnTo);
    if (safe) {
      const url = new URL(safe);
      url.searchParams.set('auth', 'success');
      return url.toString();
    }

    const frontend = this.config.get('FRONTEND_URL', { infer: true });
    return `${frontend.replace(/\/$/, '')}/?auth=success`;
  }

  toPublicUser(user: User): PublicUser {
    return toPublicUser(user);
  }

  private hasValue(value: string | undefined): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }
}
