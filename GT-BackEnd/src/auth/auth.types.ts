import { User } from '../database/entities/user.entity';

export interface GoogleProfileInput {
  googleId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface PublicPreferences {
  preferredCurrency: string;
  homeCityIata: string | null;
  defaultOriginIata: string | null;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  preferences: PublicPreferences;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    preferences: user.preferences
      ? {
          preferredCurrency: user.preferences.preferredCurrency,
          homeCityIata: user.preferences.homeCityIata,
          defaultOriginIata: user.preferences.defaultOriginIata,
        }
      : {
          preferredCurrency: 'USD',
          homeCityIata: null,
          defaultOriginIata: null,
        },
  };
}
