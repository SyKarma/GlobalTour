import { describe, expect, it } from '@jest/globals';
import { Request } from 'express';
import { AUTH_COOKIE_NAME } from './auth.constants';
import { cookieExtractor } from './cookie-extractor';

describe('cookieExtractor', () => {
  it('reads the access_token cookie', () => {
    const req = {
      cookies: { [AUTH_COOKIE_NAME]: 'jwt-value' },
    } as unknown as Request;

    expect(cookieExtractor(req)).toBe('jwt-value');
  });

  it('returns null when the cookie is missing', () => {
    expect(cookieExtractor({ cookies: {} } as Request)).toBeNull();
    expect(cookieExtractor({} as Request)).toBeNull();
  });
});
