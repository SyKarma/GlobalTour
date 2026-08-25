import { createContext } from 'react';
import type { AuthUser } from '../types/auth.types';

export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);