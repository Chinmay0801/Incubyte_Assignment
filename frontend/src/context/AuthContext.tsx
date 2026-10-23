import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import type { AuthResponse, User } from '../types';
import { AuthContext, TOKEN_STORAGE_KEY, type AuthContextValue } from './useAuth';

const readStoredToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStoredToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode); the session then lasts until reload.
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => token !== null);

  // Validate a token left over from a previous visit.
  useEffect(() => {
    const stored = readStoredToken();
    if (!stored) return;

    let cancelled = false;
    authApi
      .fetchCurrentUser(stored)
      .then((current) => {
        if (!cancelled) setUser(current);
      })
      .catch(() => {
        if (cancelled) return;
        writeStoredToken(null);
        setToken(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const startSession = useCallback(({ token: newToken, user: newUser }: AuthResponse) => {
    writeStoredToken(newToken);
    setToken(newToken);
    setUser(newUser);
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (credentials: authApi.Credentials) => startSession(await authApi.login(credentials)),
    [startSession],
  );

  const register = useCallback(
    async (registration: authApi.Registration) => startSession(await authApi.register(registration)),
    [startSession],
  );

  const logout = useCallback(() => {
    writeStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, isLoading, isAdmin: user?.role === 'admin', login, register, logout }),
    [user, token, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
