import { createContext, useContext } from 'react';
import type { Credentials, Registration } from '../api/auth';
import type { User } from '../types';

export const TOKEN_STORAGE_KEY = 'lotline.token';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  /** True while a stored token is being checked on start-up. */
  isLoading: boolean;
  isAdmin: boolean;
  login: (credentials: Credentials) => Promise<void>;
  register: (registration: Registration) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Current session and auth actions. Must be used inside <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
}
