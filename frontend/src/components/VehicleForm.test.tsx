import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VehicleForm } from './VehicleForm';
import { ApiError } from '../api/client';
import { makeVehicle } from '../test/renderWithProviders';

const fillNewVehicle = async () => {
  await userEvent.type(screen.getByLabelText('Make'), 'Kia');
  await userEvent.type(screen.getByLabelText('Model'), 'EV6');
  await userEvent.type(screen.getByLabelText('Category'), 'Electric');
  await userEvent.type(screen.getByLabelText('Price (USD)'), '42600');
  await userEvent.clear(screen.getByLabelText('Units in stock'));
  await userEvent.type(screen.getByLabelText('Units in stock'), '2');
};

describe('VehicleForm', () => {
  describe('adding', () => {
    it('submits the typed values as numbers', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<VehicleForm onSubmit={onSubmit} onCancel={vi.fn()} />);

      await fillNewVehicle();
      await userEvent.click(screen.getByRole('button', { name: 'Add vehicle' }));

      expect(onSubmit).toHaveBeenCalledWith({ make: 'Kia', model: 'EV6', category: 'Electric', price: 42600, quantity: 2 });
    });

    it('shows field errors and does not submit invalid input', async () => {
      const onSubmit = vi.fn();
      render(<VehicleForm onSubmit={onSubmit} onCancel={vi.fn()} />);

      await userEvent.type(screen.getByLabelText('Price (USD)'), '0');
      await userEvent.click(screen.getByRole('button', { name: 'Add vehicle' }));

      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText('Enter the make')).toBeInTheDocument();
      expect(screen.getByText('Enter the model')).toBeInTheDocument();
      expect(screen.getByText('Enter a category')).toBeInTheDocument();
      expect(screen.getByText('Price must be more than $0')).toBeInTheDocument();
    });

    it('rejects a fractional or negative stock count', async () => {
      const onSubmit = vi.fn();
      render(<VehicleForm onSubmit={onSubmit} onCancel={vi.fn()} />);
      await fillNewVehicle();
      await userEvent.clear(screen.getByLabelText('Units in stock'));
      await userEvent.type(screen.getByLabelText('Units in stock'), '1.5');

      await userEvent.click(screen.getByRole('button', { name: 'Add vehicle' }));

      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText('Stock must be a whole number, 0 or more')).toBeInTheDocument();
    });

    it('shows field errors returned by the server', async () => {
      const onSubmit = vi
        .fn()
        .mockRejectedValue(new ApiError(400, 'Validation failed', [{ field: 'price', message: 'Price can have at most 2 decimal places' }]));
      render(<VehicleForm onSubmit={onSubmit} onCancel={vi.fn()} />);

      await fillNewVehicle();
      await userEvent.click(screen.getByRole('button', { name: 'Add vehicle' }));

      expect(await screen.findByText('Price can have at most 2 decimal places')).toBeInTheDocument();
    });

    it('shows a general error message for other failures', async () => {
      const onSubmit = vi.fn().mockRejectedValue(new ApiError(500, 'Internal server error'));
      render(<VehicleForm onSubmit={onSubmit} onCancel={vi.fn()} />);

      await fillNewVehicle();
      await userEvent.click(screen.getByRole('button', { name: 'Add vehicle' }));

      expect(await screen.findByRole('alert')).toHaveTextContent('Internal server error');
    });

    it('calls onCancel', async () => {
      const onCancel = vi.fn();
      render(<VehicleForm onSubmit={vi.fn()} onCancel={onCancel} />);

      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('editing', () => {
    it('pre-fills the vehicle and hides the stock field', () => {
      render(<VehicleForm vehicle={makeVehicle()} onSubmit={vi.fn()} onCancel={vi.fn()} />);

      expect(screen.getByLabelText('Make')).toHaveValue('Toyota');
      expect(screen.getByLabelText('Price (USD)')).toHaveValue(28400);
      expect(screen.queryByLabelText('Units in stock')).not.toBeInTheDocument();
    });

    it('submits only editable fields', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(<VehicleForm vehicle={makeVehicle()} onSubmit={onSubmit} onCancel={vi.fn()} />);

      await userEvent.clear(screen.getByLabelText('Price (USD)'));
      await userEvent.type(screen.getByLabelText('Price (USD)'), '27000');
      await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));

      expect(onSubmit).toHaveBeenCalledWith({ make: 'Toyota', model: 'Camry', category: 'Sedan', price: 27000 });
    });
  });
});
