import { apiClient } from '../api/client';
import type {
  AuthMeResponse,
  AuthUser,
} from '../types/auth.types';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const loginWithGoogle = () => {
  window.location.assign(`${API_URL}/api/auth/google`);
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const response =
    await apiClient.get<AuthMeResponse>('/api/auth/me');

  return response.data.data;
};

export const logout = async (): Promise<void> => {
  await apiClient.post('/api/auth/logout');
};