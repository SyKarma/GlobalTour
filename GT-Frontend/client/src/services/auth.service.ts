import { apiClient } from '../api/client';
import i18n from '../i18n';
import { startLoading } from './loadingTracker';
import type {
  AuthMeResponse,
  AuthUser,
} from '../types/auth.types';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const loginWithGoogle = () => {
  // Come back to this same page (and port) after signing in with Google.
  const returnTo = new URL(window.location.href);
  returnTo.searchParams.delete('auth');

  const params = new URLSearchParams({
    returnTo: returnTo.toString(),
  });

  // Leaving for Google can take a moment: show that it is in progress.
  startLoading(i18n.t('common.connectingGoogle'));

  window.location.assign(
    `${API_URL}/api/auth/google?${params.toString()}`,
  );
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const response =
    await apiClient.get<AuthMeResponse>('/api/auth/me');

  return response.data.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/api/auth/logout');
};
