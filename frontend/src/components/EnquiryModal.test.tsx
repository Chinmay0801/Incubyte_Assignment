import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnquiryModal } from './EnquiryModal';
import { makeVehicle } from '../test/renderWithProviders';

describe('EnquiryModal', () => {
  it('prefills the message with the vehicle being enquired about', () => {
    render(<EnquiryModal vehicle={makeVehicle()} onClose={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Enquire: Toyota Camry' })).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toHaveValue(
      'Hi Chinmay, I am interested in purchasing or booking a test drive for the Toyota Camry (₹28,400).',
    );
  });

  it('uses a general message when no vehicle is given', () => {
    render(<EnquiryModal onClose={vi.fn()} onSuccess={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Enquire: Vehicle Inquiry' })).toBeInTheDocument();
  });

  it('confirms and closes after the name and phone are submitted', async () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();
    render(<EnquiryModal vehicle={makeVehicle()} onClose={onClose} onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/your name/i), '  Rahul  ');
    await userEvent.type(screen.getByLabelText(/mobile number/i), '9876543210');
    await userEvent.click(screen.getByRole('button', { name: /send enquiry/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(expect.stringContaining('Thank you Rahul!')));
    expect(onClose).toHaveBeenCalled();
  });

  it('links to WhatsApp with the vehicle in the message', () => {
    render(<EnquiryModal vehicle={makeVehicle()} onClose={vi.fn()} onSuccess={vi.fn()} />);

    const href = screen.getByRole('link', { name: /whatsapp/i }).getAttribute('href')!;
    expect(href).toMatch(/^https:\/\/wa\.me\/91\d{10}\?text=/);
    expect(decodeURIComponent(href)).toContain('Toyota Camry');
  });
});
