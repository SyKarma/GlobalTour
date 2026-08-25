export interface UserPreferences {
  preferredCurrency: string;
  homeCityIata: string | null;
  defaultOriginIata: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  preferences: UserPreferences;
}

export interface AuthMeResponse {
  data: AuthUser;
}