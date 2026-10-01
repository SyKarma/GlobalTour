import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions } from 'express';
import { EnvironmentVariables, NodeEnv } from '../config/env.validation';
import { User } from '../database/entities/user.entity';
import { AUTH_COOKIE_MAX_AGE_MS, AUTH_COOKIE_NAME } from './auth.constants';
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
    const isProduction =
      this.config.get('NODE_ENV', { infer: true }) === NodeEnv.Production;

    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
      maxAge: AUTH_COOKIE_MAX_AGE_MS,
    };
  }

  frontendRedirectUrl(): string {
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
