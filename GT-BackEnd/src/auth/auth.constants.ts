export const AUTH_COOKIE_NAME = 'access_token';
export const AUTH_JWT_EXPIRES_IN = '7d';
export const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export const DEFAULT_GOOGLE_CALLBACK_URL =
  'http://localhost:3000/api/auth/google/callback';
/** Remembers, during Google login, which page the user started from. */
export const AUTH_RETURN_COOKIE_NAME = 'gt_auth_return_to';
export const AUTH_RETURN_COOKIE_MAX_AGE_MS = 10 * 60 * 1000;
