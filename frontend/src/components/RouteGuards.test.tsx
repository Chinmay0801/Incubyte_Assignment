import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { GuestRoute, ProtectedRoute } from './RouteGuards';
import { makeAuth, regularUser, renderWithProviders, signedInAs } from '../test/renderWithProviders';

describe('ProtectedRoute', () => {
  const renderGuarded = (auth = makeAuth()) =>
    renderWithProviders(
      <ProtectedRoute>
        <p>Secret lot</p>
      </ProtectedRoute>,
      { auth, route: '/', path: '/', extraRoutes: [{ path: '/login', element: <p>Login page</p> }] },
    );

  it('redirects anonymous visitors to the login page', () => {
    renderGuarded();

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('shows a loading state while the session is being restored', () => {
    renderGuarded(makeAuth({ isLoading: true }));

    expect(screen.getByRole('status')).toHaveTextContent(/checking your session/i);
  });

  it('renders the page for signed-in users', () => {
    renderGuarded(signedInAs(regularUser));

    expect(screen.getByText('Secret lot')).toBeInTheDocument();
  });
});

describe('GuestRoute', () => {
  it('sends signed-in users to the lot', () => {
    renderWithProviders(
      <GuestRoute>
        <p>Login form</p>
      </GuestRoute>,
      { auth: signedInAs(regularUser), route: '/login', path: '/login', extraRoutes: [{ path: '/', element: <p>Home page</p> }] },
    );

    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('shows the page to anonymous visitors', () => {
    renderWithProviders(
      <GuestRoute>
        <p>Login form</p>
      </GuestRoute>,
      { route: '/login', path: '/login' },
    );

    expect(screen.getByText('Login form')).toBeInTheDocument();
  });
});
