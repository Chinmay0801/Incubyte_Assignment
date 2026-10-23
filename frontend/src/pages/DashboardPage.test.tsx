import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from './DashboardPage';
import * as vehiclesApi from '../api/vehicles';
import { ApiError } from '../api/client';
import { adminUser, makeVehicle, regularUser, renderWithProviders, signedInAs } from '../test/renderWithProviders';

vi.mock('../api/vehicles');
const api = vi.mocked(vehiclesApi);

const camry = makeVehicle({ id: 1, make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28400, quantity: 2 });
const rav4 = makeVehicle({ id: 2, make: 'Toyota', model: 'RAV4', category: 'SUV', price: 31000, quantity: 0 });
const f150 = makeVehicle({ id: 3, make: 'Ford', model: 'F-150', category: 'Truck', price: 45000, quantity: 5 });

const renderDashboard = (auth = signedInAs(regularUser)) => {
  renderWithProviders(<DashboardPage />, { auth });
  return auth;
};

const card = (name: string) => screen.getByRole('article', { name });

describe('DashboardPage', () => {
  beforeEach(() => {
    api.listVehicles.mockResolvedValue([camry, rav4, f150]);
  });

  describe('browsing', () => {
    it('loads and shows every vehicle with the token', async () => {
      renderDashboard();

      expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
      expect(await screen.findByRole('article', { name: 'Toyota Camry' })).toBeInTheDocument();
      expect(card('Toyota RAV4')).toBeInTheDocument();
      expect(card('Ford F-150')).toBeInTheDocument();
      expect(api.listVehicles).toHaveBeenCalledWith('token-1');
    });

    it('summarises the lot', async () => {
      renderDashboard();

      expect(await screen.findByText('3 models · 7 units on the lot')).toBeInTheDocument();
    });

    it('disables Purchase for sold-out vehicles only', async () => {
      renderDashboard();
      await screen.findByRole('article', { name: 'Toyota Camry' });

      expect(within(card('Toyota RAV4')).getByRole('button', { name: /purchase/i })).toBeDisabled();
      expect(within(card('Toyota Camry')).getByRole('button', { name: /purchase/i })).toBeEnabled();
    });

    it('can hide sold-out vehicles', async () => {
      renderDashboard();
      await screen.findByRole('article', { name: 'Toyota Camry' });

      await userEvent.click(screen.getByLabelText('In stock only'));

      expect(screen.queryByRole('article', { name: 'Toyota RAV4' })).not.toBeInTheDocument();
      expect(card('Toyota Camry')).toBeInTheDocument();
    });

    it('explains an empty lot', async () => {
      api.listVehicles.mockResolvedValue([]);
      renderDashboard();

      expect(await screen.findByText('The lot is empty.')).toBeInTheDocument();
    });

    it('shows a load error with a retry', async () => {
      api.listVehicles.mockRejectedValueOnce(new ApiError(0, "Can't reach the server."));
      renderDashboard();

      expect(await screen.findByRole('alert')).toHaveTextContent("Can't reach the server.");
      await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
      expect(await screen.findByRole('article', { name: 'Toyota Camry' })).toBeInTheDocument();
    });

    it('signs the user out when the session has expired', async () => {
      api.listVehicles.mockRejectedValueOnce(new ApiError(401, 'Invalid or expired token'));
      const auth = renderDashboard();

      await waitFor(() => expect(auth.logout).toHaveBeenCalled());
    });

    it('hides admin controls from regular users', async () => {
      renderDashboard();
      await screen.findByRole('article', { name: 'Toyota Camry' });

      expect(screen.queryByRole('button', { name: 'Add vehicle' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });
  });

  describe('searching', () => {
    it('searches with the filters and shows the results', async () => {
      api.searchVehicles.mockResolvedValue([f150]);
      renderDashboard();
      await screen.findByRole('article', { name: 'Toyota Camry' });

      await userEvent.type(screen.getByLabelText('Make'), 'Ford');
      await userEvent.click(screen.getByRole('button', { name: 'Search' }));

      await waitFor(() => expect(screen.queryByRole('article', { name: 'Toyota Camry' })).not.toBeInTheDocument());
      expect(card('Ford F-150')).toBeInTheDocument();
      expect(api.searchVehicles).toHaveBeenCalledWith('token-1', expect.objectContaining({ make: 'Ford' }));
    });

    it('offers the categories on the lot as filter options', async () => {
      renderDashboard();
      await screen.findByRole('article', { name: 'Toyota Camry' });

      const options = within(screen.getByLabelText('Category')).getAllByRole('option').map((o) => o.textContent);
      expect(options).toEqual(['All categories', 'Sedan', 'SUV', 'Truck']);
    });

    it('explains when nothing matches', async () => {
      api.searchVehicles.mockResolvedValue([]);
      renderDashboard();
      await screen.findByRole('article', { name: 'Toyota Camry' });

      await userEvent.type(screen.getByLabelText('Make'), 'Ferrari');
      await userEvent.click(screen.getByRole('button', { name: 'Search' }));

      expect(await screen.findByText('No vehicles match these filters.')).toBeInTheDocument();
    });

    it('reloads the full lot when filters are cleared', async () => {
      api.searchVehicles.mockResolvedValue([f150]);
      renderDashboard();
      await screen.findByRole('article', { name: 'Toyota Camry' });
      await userEvent.click(screen.getByRole('button', { name: 'Search' }));
      await waitFor(() => expect(screen.queryByRole('article', { name: 'Toyota Camry' })).not.toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

      expect(await screen.findByRole('article', { name: 'Toyota Camry' })).toBeInTheDocument();
    });

    it('shows search errors', async () => {
      api.searchVehicles.mockRejectedValue(new ApiError(400, 'minPrice cannot be greater than maxPrice'));
      renderDashboard();
      await screen.findByRole('article', { name: 'Toyota Camry' });

      await userEvent.click(screen.getByRole('button', { name: 'Search' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('minPrice cannot be greater than maxPrice');
    });
  });

  describe('purchasing', () => {
    it('buys one unit and updates the stock shown', async () => {
      api.purchaseVehicle.mockResolvedValue({ ...camry, quantity: 1 });
      renderDashboard();
      await screen.findByRole('article', { name: 'Toyota Camry' });

      await userEvent.click(within(card('Toyota Camry')).getByRole('button', { name: /purchase/i }));

      expect(api.purchaseVehicle).toHaveBeenCalledWith('token-1', 1);
      expect(await within(card('Toyota Camry')).findByText('1 in stock')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Purchased Toyota Camry. 1 left on the lot.');
    });

    it('disables Purchase once the last unit is bought', async () => {
      api.purchaseVehicle.mockResolvedValue({ ...camry, quantity: 0 });
      renderDashboard();
      await screen.findByRole('article', { name: 'Toyota Camry' });

      await userEvent.click(within(card('Toyota Camry')).getByRole('button', { name: /purchase/i }));

      await waitFor(() => expect(within(card('Toyota Camry')).getByRole('button', { name: /purchase/i })).toBeDisabled());
    });

    it('reports a failed purchase', async () => {
      api.purchaseVehicle.mockRejectedValue(new ApiError(409, 'Toyota Camry is out of stock'));
      renderDashboard();
      await screen.findByRole('article', { name: 'Toyota Camry' });

      await userEvent.click(within(card('Toyota Camry')).getByRole('button', { name: /purchase/i }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Toyota Camry is out of stock');
    });
  });

  describe('admin tools', () => {
    const renderAsAdmin = () => renderDashboard(signedInAs(adminUser));

    it('adds a vehicle', async () => {
      const ev6 = makeVehicle({ id: 4, make: 'Kia', model: 'EV6', category: 'Electric', price: 42600, quantity: 2 });
      api.createVehicle.mockResolvedValue(ev6);
      renderAsAdmin();
      await screen.findByRole('article', { name: 'Toyota Camry' });

      await userEvent.click(screen.getByRole('button', { name: 'Add vehicle' }));
      const dialog = screen.getByRole('dialog', { name: 'Add vehicle' });
      await userEvent.type(within(dialog).getByLabelText('Make'), 'Kia');
      await userEvent.type(within(dialog).getByLabelText('Model'), 'EV6');
      await userEvent.type(within(dialog).getByLabelText('Category'), 'Electric');
      await userEvent.type(within(dialog).getByLabelText('Price (USD)'), '42600');
      await userEvent.clear(within(dialog).getByLabelText('Units in stock'));
      await userEvent.type(within(dialog).getByLabelText('Units in stock'), '2');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Add vehicle' }));

      expect(api.createVehicle).toHaveBeenCalledWith('token-2', { make: 'Kia', model: 'EV6', category: 'Electric', price: 42600, quantity: 2 });
      expect(await screen.findByRole('article', { name: 'Kia EV6' })).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('Added Kia EV6 to the lot.');
    });

    it('edits a vehicle', async () => {
      api.updateVehicle.mockResolvedValue({ ...camry, price: 27000 });
      renderAsAdmin();
      await screen.findByRole('article', { name: 'Toyota Camry' });

      await userEvent.click(within(card('Toyota Camry')).getByRole('button', { name: /edit/i }));
      const dialog = screen.getByRole('dialog', { name: 'Edit vehicle' });
      await userEvent.clear(within(dialog).getByLabelText('Price (USD)'));
      await userEvent.type(within(dialog).getByLabelText('Price (USD)'), '27000');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }));

      expect(api.updateVehicle).toHaveBeenCalledWith('token-2', 1, { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 27000 });
      expect(await within(card('Toyota Camry')).findByText('$27,000')).toBeInTheDocument();
    });

    it('restocks a vehicle', async () => {
      api.restockVehicle.mockResolvedValue({ ...rav4, quantity: 4 });
      renderAsAdmin();
      await screen.findByRole('article', { name: 'Toyota RAV4' });

      await userEvent.click(within(card('Toyota RAV4')).getByRole('button', { name: /restock/i }));
      const dialog = screen.getByRole('dialog', { name: 'Restock vehicle' });
      await userEvent.clear(within(dialog).getByLabelText('Units to add'));
      await userEvent.type(within(dialog).getByLabelText('Units to add'), '4');
      await userEvent.click(within(dialog).getByRole('button', { name: 'Restock' }));

      expect(api.restockVehicle).toHaveBeenCalledWith('token-2', 2, 4);
      expect(await within(card('Toyota RAV4')).findByText('4 in stock')).toBeInTheDocument();
      expect(within(card('Toyota RAV4')).getByRole('button', { name: /purchase/i })).toBeEnabled();
    });

    it('deletes a vehicle after confirmation', async () => {
      api.deleteVehicle.mockResolvedValue(undefined);
      renderAsAdmin();
      await screen.findByRole('article', { name: 'Ford F-150' });

      await userEvent.click(within(card('Ford F-150')).getByRole('button', { name: /delete/i }));
      const dialog = screen.getByRole('dialog', { name: 'Delete vehicle?' });
      await userEvent.click(within(dialog).getByRole('button', { name: 'Delete vehicle' }));

      expect(api.deleteVehicle).toHaveBeenCalledWith('token-2', 3);
      await waitFor(() => expect(screen.queryByRole('article', { name: 'Ford F-150' })).not.toBeInTheDocument());
      expect(screen.getByRole('status')).toHaveTextContent('Deleted Ford F-150.');
    });

    it('keeps the vehicle when deletion is cancelled', async () => {
      renderAsAdmin();
      await screen.findByRole('article', { name: 'Ford F-150' });

      await userEvent.click(within(card('Ford F-150')).getByRole('button', { name: /delete/i }));
      await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }));

      expect(api.deleteVehicle).not.toHaveBeenCalled();
      expect(card('Ford F-150')).toBeInTheDocument();
    });
  });
});
