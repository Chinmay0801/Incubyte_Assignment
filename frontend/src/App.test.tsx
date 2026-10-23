import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App';
import { AuthContext } from './context/AuthContext';
import * as vehiclesApi from './api/vehicles';
import { adminUser, makeAuth, regularUser, signedInAs } from './test/renderWithProviders';

vi.mock('./api/vehicles');

const renderApp = (route: string, auth = makeAuth()) =>
  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe('App routing', () => {
  it('shows the sign-in page to anonymous visitors of the lot', () => {
    renderApp('/');

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows the registration page', () => {
    renderApp('/register');

    expect(screen.getByRole('heading', { name: 'Create an account' })).toBeInTheDocument();
  });

  it('shows the lot to signed-in users with their name and sign-out', async () => {
    vi.mocked(vehiclesApi.listVehicles).mockResolvedValue([]);
    const auth = signedInAs(regularUser);
    renderApp('/', auth);

    expect(await screen.findByText('The lot is empty.')).toBeInTheDocument();
    expect(screen.getByText('Jane Buyer')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(auth.logout).toHaveBeenCalled();
  });

  it('labels admins in the header', async () => {
    vi.mocked(vehiclesApi.listVehicles).mockResolvedValue([]);
    renderApp('/', signedInAs(adminUser));

    expect(await screen.findByText('Admin')).toBeInTheDocument();
  });

  it('redirects unknown paths to the lot', async () => {
    vi.mocked(vehiclesApi.listVehicles).mockResolvedValue([]);
    renderApp('/nowhere', signedInAs(regularUser));

    expect(await screen.findByText('The lot is empty.')).toBeInTheDocument();
  });
});
