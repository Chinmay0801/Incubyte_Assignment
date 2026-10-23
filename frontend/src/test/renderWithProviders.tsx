import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../context/useAuth';
import type { User, Vehicle } from '../types';

export const regularUser: User = { id: 1, name: 'Jane Buyer', email: 'jane@example.com', role: 'user' };
export const adminUser: User = { id: 2, name: 'Alex Admin', email: 'admin@example.com', role: 'admin' };

export const makeVehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: 1,
  make: 'Toyota',
  model: 'Camry',
  category: 'Sedan',
  price: 28400,
  quantity: 3,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
});

/** Builds an auth context value; defaults to a signed-out, loaded state. */
export const makeAuth = (overrides: Partial<AuthContextValue> = {}): AuthContextValue => ({
  user: null,
  token: null,
  isLoading: false,
  isAdmin: false,
  login: vi.fn().mockResolvedValue(undefined),
  register: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn(),
  ...overrides,
});

export const signedInAs = (user: User, overrides: Partial<AuthContextValue> = {}) =>
  makeAuth({ user, token: `token-${user.id}`, isAdmin: user.role === 'admin', ...overrides });

interface Options {
  auth?: AuthContextValue;
  /** Initial URL. */
  route?: string;
  /** Extra routes rendered next to the UI, useful to assert redirects. */
  extraRoutes?: { path: string; element: ReactElement }[];
  /** Path pattern the UI is mounted at. */
  path?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { auth = makeAuth(), route = '/', extraRoutes = [], path = '*' }: Options = {},
) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          {extraRoutes.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          <Route path={path} element={ui} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}
