/**
 * Which frontend addresses may talk to this API (CORS) and may receive the
 * user back after Google login.
 */

const PRODUCTION_FRONTENDS = ['https://globaltour-six.vercel.app'];

// In development Vite may start on 5174, 5175... when 5173 is taken.
const LOCAL_DEV_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

export type OriginSettings = {
  corsOrigin?: string;
  frontendUrl?: string;
  isProduction: boolean;
};

export function createOriginChecker(
  settings: OriginSettings,
): (origin: string) => boolean {
  const allowed = new Set(
    [
      ...(settings.corsOrigin ?? '').split(','),
      settings.frontendUrl ?? '',
      ...PRODUCTION_FRONTENDS,
    ]
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean),
  );

  return (origin: string) =>
    allowed.has(origin) ||
    (!settings.isProduction && LOCAL_DEV_ORIGIN.test(origin));
}
