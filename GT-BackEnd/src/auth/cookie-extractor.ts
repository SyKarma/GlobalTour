import { Request } from 'express';
import { AUTH_COOKIE_NAME } from './auth.constants';

function cookiesFrom(req: Request): Record<string, unknown> | undefined {
  const cookies: unknown = req.cookies;
  if (typeof cookies !== 'object' || cookies === null) {
    return undefined;
  }
  return cookies as Record<string, unknown>;
}

export function cookieExtractor(req: Request): string | null {
  const token = cookiesFrom(req)?.[AUTH_COOKIE_NAME];
  return typeof token === 'string' && token.length > 0 ? token : null;
}
