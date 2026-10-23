import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';
import { RestockForm } from './RestockForm';
import { ApiError } from '../api/client';
import { makeVehicle } from '../test/renderWithProviders';

describe('Modal', () => {
  it('renders an accessible dialog with a title', () => {
    render(
      <Modal title="Hello" onClose={vi.fn()}>
        <p>Body</p>
      </Modal>,
    );

    expect(screen.getByRole('dialog', { name: 'Hello' })).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('closes on Escape and on the close button', async () => {
    const onClose = vi.fn();
    render(
      <Modal title="Hello" onClose={onClose}>
        <input aria-label="field" />
      </Modal>,
    );

    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe('ConfirmDialog', () => {
  it('confirms and cancels', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        title="Delete vehicle?"
        message="This removes it."
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onConfirm).toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalled();
  });

  it('shows an error if confirming fails', async () => {
    const onConfirm = vi.fn().mockRejectedValue(new ApiError(403, 'Admin access required'));
    render(<ConfirmDialog title="Delete?" message="m" confirmLabel="Delete" onConfirm={onConfirm} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Admin access required');
  });
});

describe('RestockForm', () => {
  it('submits a positive whole number of units', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<RestockForm vehicle={makeVehicle({ quantity: 2 })} onSubmit={onSubmit} onCancel={vi.fn()} />);

    expect(screen.getByText(/2 in stock now/i)).toBeInTheDocument();
    await userEvent.clear(screen.getByLabelText('Units to add'));
    await userEvent.type(screen.getByLabelText('Units to add'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Restock' }));

    expect(onSubmit).toHaveBeenCalledWith(5);
  });

  it.each(['0', '-2', '2.5'])('rejects %s', async (value) => {
    const onSubmit = vi.fn();
    render(<RestockForm vehicle={makeVehicle()} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await userEvent.clear(screen.getByLabelText('Units to add'));
    await userEvent.type(screen.getByLabelText('Units to add'), value);
    await userEvent.click(screen.getByRole('button', { name: 'Restock' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Enter a whole number of 1 or more')).toBeInTheDocument();
  });

  it('shows server errors', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(404, 'Vehicle 1 not found'));
    render(<RestockForm vehicle={makeVehicle()} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Restock' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Vehicle 1 not found');
  });
});
