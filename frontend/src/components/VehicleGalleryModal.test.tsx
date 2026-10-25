import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VehicleGalleryModal } from './VehicleGalleryModal';
import { makeVehicle } from '../test/renderWithProviders';

const nexon = (overrides = {}) => makeVehicle({ make: 'Tata Motors', model: 'Nexon', quantity: 4, ...overrides });

describe('VehicleGalleryModal', () => {
  it('shows the first photo and moves through the gallery with the arrows and keyboard', async () => {
    render(<VehicleGalleryModal vehicle={nexon()} onClose={vi.fn()} />);

    const counter = screen.getByText(/^1 \/ \d+$/);
    const total = counter.textContent!.split(' / ')[1];

    await userEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(screen.getByText(`2 / ${total}`)).toBeInTheDocument();

    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByText(`1 / ${total}`)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Previous photo' }));
    expect(screen.getByText(`${total} / ${total}`)).toBeInTheDocument();
  });

  it('jumps to a photo when its thumbnail is clicked', async () => {
    render(<VehicleGalleryModal vehicle={nexon()} onClose={vi.fn()} />);

    await userEvent.click(screen.getByAltText('thumbnail 3').closest('button')!);

    expect(screen.getByAltText('Tata Motors Nexon - photo 3')).toBeInTheDocument();
  });

  it('falls back to the vehicle image when no gallery exists', () => {
    render(<VehicleGalleryModal vehicle={makeVehicle({ imageUrl: '/custom.jpg' })} onClose={vi.fn()} />);

    expect(screen.getByAltText('Toyota Camry - photo 1')).toHaveAttribute('src', '/custom.jpg');
    expect(screen.queryByRole('button', { name: 'Next photo' })).not.toBeInTheDocument();
  });

  it('purchases the vehicle', async () => {
    const onPurchase = vi.fn();
    const vehicle = nexon();
    render(<VehicleGalleryModal vehicle={vehicle} onClose={vi.fn()} onPurchase={onPurchase} />);

    await userEvent.click(screen.getByRole('button', { name: 'Purchase Vehicle' }));

    expect(onPurchase).toHaveBeenCalledWith(vehicle);
  });

  it('disables Purchase when the vehicle is sold out', () => {
    render(<VehicleGalleryModal vehicle={nexon({ quantity: 0 })} onClose={vi.fn()} onPurchase={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Sold Out' })).toBeDisabled();
  });

  it('closes on Escape and on the close button', async () => {
    const onClose = vi.fn();
    render(<VehicleGalleryModal vehicle={nexon()} onClose={onClose} />);

    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Close dialog' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('closes and opens the enquiry for this vehicle', async () => {
    const onClose = vi.fn();
    const onEnquire = vi.fn();
    const vehicle = nexon();
    render(<VehicleGalleryModal vehicle={vehicle} onClose={onClose} onEnquire={onEnquire} />);

    await userEvent.click(screen.getByRole('button', { name: /enquire/i }));

    expect(onClose).toHaveBeenCalled();
    expect(onEnquire).toHaveBeenCalledWith(vehicle);
  });
});
