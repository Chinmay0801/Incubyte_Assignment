import type { AuthResponse, User } from '../types';
import { apiRequest } from './client';

export interface Credentials {
  email: string;
  password: string;
}

export interface Registration extends Credentials {
  name: string;
}

export const register = (input: Registration) =>
  apiRequest<AuthResponse>('/api/auth/register', { method: 'POST', body: input });

export const login = (input: Credentials) => apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: input });

export const fetchCurrentUser = async (token: string): Promise<User> =>
  (await apiRequest<{ user: User }>('/api/auth/me', { token })).user;
