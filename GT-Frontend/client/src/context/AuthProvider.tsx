import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isAxiosError } from 'axios';
import { AuthContext } from './auth.context';
import {
  getCurrentUser,
  loginWithGoogle,
  logout as logoutRequest,
} from '../services/auth.service';
import type { AuthUser } from '../types/auth.types';

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);

    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setUser(null);
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      await refreshUser();

      const params = new URLSearchParams(window.location.search);

      if (params.get('auth') === 'success') {
        params.delete('auth');

        const queryString = params.toString();

        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}${
            queryString ? `?${queryString}` : ''
          }${window.location.hash}`,
        );
      }
    };

    void initializeAuth();
  }, [refreshUser]);

  const login = useCallback(() => {
    loginWithGoogle();
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;