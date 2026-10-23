import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VehicleCard } from './VehicleCard';
import { makeVehicle } from '../test/renderWithProviders';

const handlers = () => ({
  onPurchase: vi.fn(),
  onEdit: vi.fn(),
  onRestock: vi.fn(),
  onDelete: vi.fn(),
});

describe('VehicleCard', () => {
  it('shows the make, model, category, price and stock', () => {
    render(<VehicleCard vehicle={makeVehicle({ price: 28400, quantity: 3 })} isAdmin={false} {...handlers()} />);

    const card = screen.getByRole('article', { name: 'Toyota Camry' });
    expect(within(card).getByText('Toyota')).toBeInTheDocument();
    expect(within(card).getByText('Camry')).toBeInTheDocument();
    expect(within(card).getByText('Sedan')).toBeInTheDocument();
    expect(within(card).getByText('$28,400')).toBeInTheDocument();
    expect(within(card).getByText('3 in stock')).toBeInTheDocument();
  });

  it('formats prices with cents when needed', () => {
    render(<VehicleCard vehicle={makeVehicle({ price: 19999.5 })} isAdmin={false} {...handlers()} />);

    expect(screen.getByText('$19,999.50')).toBeInTheDocument();
  });

  it('calls onPurchase when Purchase is clicked', async () => {
    const h = handlers();
    const vehicle = makeVehicle();
    render(<VehicleCard vehicle={vehicle} isAdmin={false} {...h} />);

    await userEvent.click(screen.getByRole('button', { name: /purchase/i }));

    expect(h.onPurchase).toHaveBeenCalledWith(vehicle);
  });

  it('disables Purchase and shows "Sold out" when quantity is zero', async () => {
    const h = handlers();
    render(<VehicleCard vehicle={makeVehicle({ quantity: 0 })} isAdmin={false} {...h} />);

    const button = screen.getByRole('button', { name: /purchase/i });
    expect(button).toBeDisabled();
    expect(screen.getAllByText(/sold out/i).length).toBeGreaterThan(0);
    await userEvent.click(button);
    expect(h.onPurchase).not.toHaveBeenCalled();
  });

  it('disables Purchase while a purchase is in progress', () => {
    render(<VehicleCard vehicle={makeVehicle()} isAdmin={false} isBusy {...handlers()} />);

    expect(screen.getByRole('button', { name: /purchas/i })).toBeDisabled();
  });

  it('flags low stock', () => {
    render(<VehicleCard vehicle={makeVehicle({ quantity: 1 })} isAdmin={false} {...handlers()} />);

    expect(screen.getByText('Last one')).toBeInTheDocument();
  });

  it('hides admin actions from regular users', () => {
    render(<VehicleCard vehicle={makeVehicle()} isAdmin={false} {...handlers()} />);

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /restock/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('shows admin actions to admins and wires them up', async () => {
    const h = handlers();
    const vehicle = makeVehicle();
    render(<VehicleCard vehicle={vehicle} isAdmin {...h} />);

    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    await userEvent.click(screen.getByRole('button', { name: /restock/i }));
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(h.onEdit).toHaveBeenCalledWith(vehicle);
    expect(h.onRestock).toHaveBeenCalledWith(vehicle);
    expect(h.onDelete).toHaveBeenCalledWith(vehicle);
  });
});
