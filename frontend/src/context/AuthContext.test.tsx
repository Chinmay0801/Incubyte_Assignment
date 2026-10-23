import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, TOKEN_STORAGE_KEY, useAuth } from './AuthContext';
import * as authApi from '../api/auth';
import { ApiError } from '../api/client';

vi.mock('../api/auth');

const jane = { id: 1, name: 'Jane', email: 'jane@example.com', role: 'user' as const };

/** Renders the auth state as text and exposes the actions as buttons. */
function Probe() {
  const { user, token, isLoading, isAdmin, login, register, logout } = useAuth();
  return (
    <div>
      <p data-testid="state">{isLoading ? 'loading' : user ? `${user.name}|${token}|${isAdmin}` : 'anonymous'}</p>
      <button onClick={() => login({ email: 'jane@example.com', password: 'password1' })}>login</button>
      <button onClick={() => register({ name: 'Jane', email: 'jane@example.com', password: 'password1' })}>
        register
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

describe('AuthProvider', () => {
  afterEach(() => vi.mocked(authApi.fetchCurrentUser).mockReset());

  it('starts anonymous when no token is stored', async () => {
    renderProbe();

    expect(await screen.findByText('anonymous')).toBeInTheDocument();
    expect(authApi.fetchCurrentUser).not.toHaveBeenCalled();
  });

  it('logs in, stores the token and exposes the user', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ token: 'tok-1', user: jane });
    renderProbe();

    await userEvent.click(screen.getByRole('button', { name: 'login' }));

    expect(await screen.findByText('Jane|tok-1|false')).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe('tok-1');
  });

  it('registers and signs the new user in', async () => {
    vi.mocked(authApi.register).mockResolvedValue({ token: 'tok-2', user: jane });
    renderProbe();

    await userEvent.click(screen.getByRole('button', { name: 'register' }));

    expect(await screen.findByText('Jane|tok-2|false')).toBeInTheDocument();
  });

  it('flags admins', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ token: 't', user: { ...jane, role: 'admin' } });
    renderProbe();

    await userEvent.click(screen.getByRole('button', { name: 'login' }));

    expect(await screen.findByText('Jane|t|true')).toBeInTheDocument();
  });

  it('logs out and forgets the token', async () => {
    vi.mocked(authApi.login).mockResolvedValue({ token: 'tok-1', user: jane });
    renderProbe();
    await userEvent.click(screen.getByRole('button', { name: 'login' }));
    await screen.findByText('Jane|tok-1|false');

    await userEvent.click(screen.getByRole('button', { name: 'logout' }));

    expect(screen.getByText('anonymous')).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('restores a session from a stored token', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'saved');
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(jane);

    renderProbe();

    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(await screen.findByText('Jane|saved|false')).toBeInTheDocument();
    expect(authApi.fetchCurrentUser).toHaveBeenCalledWith('saved');
  });

  it('discards a stored token the server rejects', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'expired');
    vi.mocked(authApi.fetchCurrentUser).mockRejectedValue(new ApiError(401, 'Invalid or expired token'));

    renderProbe();

    expect(await screen.findByText('anonymous')).toBeInTheDocument();
    await waitFor(() => expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull());
  });

  it('propagates login errors to the caller', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new ApiError(401, 'Invalid email or password'));
    let caught: unknown;
    function Caller() {
      const { login } = useAuth();
      return <button onClick={() => login({ email: 'a', password: 'b' }).catch((e) => (caught = e))}>go</button>;
    }
    render(
      <AuthProvider>
        <Caller />
      </AuthProvider>,
    );

    await act(() => userEvent.click(screen.getByRole('button', { name: 'go' })));

    await waitFor(() => expect(caught).toBeInstanceOf(ApiError));
  });

  it('throws a helpful error when useAuth is used outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Probe />)).toThrow(/AuthProvider/);
  });
});
