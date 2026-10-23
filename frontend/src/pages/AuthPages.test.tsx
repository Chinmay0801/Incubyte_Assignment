import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { ApiError } from '../api/client';
import { makeAuth, renderWithProviders } from '../test/renderWithProviders';

const home = { path: '/', element: <p>Home page</p> };

describe('LoginPage', () => {
  const renderLogin = (auth = makeAuth()) =>
    renderWithProviders(<LoginPage />, { auth, route: '/login', path: '/login', extraRoutes: [home, { path: '/register', element: <p>Register page</p> }] });

  it('signs in with the typed credentials and goes to the lot', async () => {
    const auth = makeAuth();
    renderLogin(auth);

    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(auth.login).toHaveBeenCalledWith({ email: 'jane@example.com', password: 'password123' });
    expect(await screen.findByText('Home page')).toBeInTheDocument();
  });

  it('shows the server error when sign-in fails', async () => {
    const auth = makeAuth({ login: vi.fn().mockRejectedValue(new ApiError(401, 'Invalid email or password')) });
    renderLogin(auth);

    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(screen.queryByText('Home page')).not.toBeInTheDocument();
  });

  it('requires both fields before calling the API', async () => {
    const auth = makeAuth();
    renderLogin(auth);

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(auth.login).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your email and password.');
  });

  it('links to registration', async () => {
    renderLogin();

    await userEvent.click(screen.getByRole('link', { name: /create an account/i }));

    expect(screen.getByText('Register page')).toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  const renderRegister = (auth = makeAuth()) =>
    renderWithProviders(<RegisterPage />, { auth, route: '/register', path: '/register', extraRoutes: [home, { path: '/login', element: <p>Login page</p> }] });

  const fill = async (overrides: Partial<Record<'name' | 'email' | 'password' | 'confirm', string>> = {}) => {
    const values = { name: 'Jane Doe', email: 'jane@example.com', password: 'password123', confirm: 'password123', ...overrides };
    if (values.name) await userEvent.type(screen.getByLabelText('Full name'), values.name);
    if (values.email) await userEvent.type(screen.getByLabelText('Email'), values.email);
    if (values.password) await userEvent.type(screen.getByLabelText('Password'), values.password);
    if (values.confirm) await userEvent.type(screen.getByLabelText('Confirm password'), values.confirm);
  };

  it('creates the account and goes to the lot', async () => {
    const auth = makeAuth();
    renderRegister(auth);

    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(auth.register).toHaveBeenCalledWith({ name: 'Jane Doe', email: 'jane@example.com', password: 'password123' });
    expect(await screen.findByText('Home page')).toBeInTheDocument();
  });

  it('checks that the passwords match', async () => {
    const auth = makeAuth();
    renderRegister(auth);

    await fill({ confirm: 'different1' });
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(auth.register).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent("Passwords don't match.");
  });

  it('requires a password of at least 8 characters', async () => {
    const auth = makeAuth();
    renderRegister(auth);

    await fill({ password: 'short', confirm: 'short' });
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(auth.register).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Use at least 8 characters for your password.');
  });

  it('shows server errors such as a taken email', async () => {
    const auth = makeAuth({ register: vi.fn().mockRejectedValue(new ApiError(409, 'An account with this email already exists')) });
    renderRegister(auth);

    await fill();
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('An account with this email already exists');
  });

  it('links back to sign in', async () => {
    renderRegister();

    await userEvent.click(screen.getByRole('link', { name: /sign in/i }));

    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});
