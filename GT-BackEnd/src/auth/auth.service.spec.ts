import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../database/entities/user.entity';
import { AuthService } from './auth.service';
import { AUTH_COOKIE_NAME } from './auth.constants';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  const upsertFromGoogle = jest.fn();
  const sign = jest.fn<(payload: object) => string>();
  const configValues: Record<string, string | undefined> = {};

  beforeEach(async () => {
    upsertFromGoogle.mockReset();
    sign.mockReset();
    sign.mockReturnValue('signed-jwt');
    configValues.GOOGLE_CLIENT_ID = undefined;
    configValues.GOOGLE_CLIENT_SECRET = undefined;
    configValues.FRONTEND_URL = 'http://localhost:5173';
    configValues.NODE_ENV = 'development';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: { upsertFromGoogle } },
        { provide: JwtService, useValue: { sign } },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => configValues[key],
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('treats missing Google credentials as unconfigured', () => {
    expect(service.isConfigured()).toBe(false);
    expect(() => service.assertConfigured()).toThrow(
      ServiceUnavailableException,
    );
  });

  it('is configured when both Google credentials are set', () => {
    configValues.GOOGLE_CLIENT_ID = 'client-id';
    configValues.GOOGLE_CLIENT_SECRET = 'client-secret';
    expect(service.isConfigured()).toBe(true);
  });

  it('signs a JWT with the user id and email', () => {
    const user = { id: 'user-1', email: 'sam@example.com' } as User;
    expect(service.signToken(user)).toBe('signed-jwt');
    expect(sign).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'sam@example.com',
    });
  });

  it('sets a lax httpOnly cookie and enables Secure in production', () => {
    expect(service.cookieName()).toBe(AUTH_COOKIE_NAME);
    expect(service.cookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
    });

    configValues.NODE_ENV = 'production';
    expect(service.cookieOptions().secure).toBe(true);
  });

  it('redirects to the frontend success URL', () => {
    expect(service.frontendRedirectUrl()).toBe(
      'http://localhost:5173/?auth=success',
    );
  });

  it('maps a user to the public profile shape', () => {
    const user = {
      id: 'user-1',
      email: 'sam@example.com',
      displayName: 'Sam',
      avatarUrl: null,
      preferences: {
        preferredCurrency: 'USD',
        homeCityIata: 'SJO',
        defaultOriginIata: 'SJO',
      },
    } as User;

    expect(service.toPublicUser(user)).toEqual({
      id: 'user-1',
      email: 'sam@example.com',
      displayName: 'Sam',
      avatarUrl: null,
      preferences: {
        preferredCurrency: 'USD',
        homeCityIata: 'SJO',
        defaultOriginIata: 'SJO',
      },
    });
  });
});
