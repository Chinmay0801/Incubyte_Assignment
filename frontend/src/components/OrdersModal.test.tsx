import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrdersModal } from './OrdersModal';
import { fetchCall, jsonResponse, mockFetch } from '../test/fetchMock';
import type { Order } from '../types';

afterEach(() => vi.unstubAllGlobals());

const makeOrder = (overrides: Partial<Order> = {}): Order => ({
  id: 7,
  userId: 1,
  vehicleId: 3,
  make: 'Tata Motors',
  model: 'Nexon',
  category: 'Compact SUV',
  quantity: 2,
  unitPrice: 800000,
  totalPrice: 1600000,
  purchasedAt: '2026-10-24T10:00:00.000Z',
  ...overrides,
});

describe('OrdersModal', () => {
  it("lists a customer's own purchases from /api/orders/my", async () => {
    const fetchFn = mockFetch(jsonResponse([makeOrder()]));

    render(<OrdersModal token="t" isAdmin={false} onClose={vi.fn()} />);

    expect(await screen.findByText('Tata Motors Nexon')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'My Purchase History' })).toBeInTheDocument();
    expect(screen.getByText('₹16,00,000')).toBeInTheDocument();
    expect(screen.queryByText('Customer')).not.toBeInTheDocument();
    expect(fetchCall(fetchFn).url).toBe('/api/orders/my');
  });

  it('shows an empty state when there are no purchases', async () => {
    mockFetch(jsonResponse([]));

    render(<OrdersModal token="t" isAdmin={false} onClose={vi.fn()} />);

    expect(await screen.findByText('No purchases recorded yet.')).toBeInTheDocument();
  });

  it('shows the sales ledger with revenue totals and customers for admins', async () => {
    const fetchFn = mockFetch(
      jsonResponse({ orders: [makeOrder({ userName: 'Jane Buyer' })], totalRevenue: 1600000, totalUnitsSold: 2 }),
    );

    render(<OrdersModal token="t" isAdmin onClose={vi.fn()} />);

    expect(await screen.findByText('Jane Buyer')).toBeInTheDocument();
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getAllByText('₹16,00,000')).toHaveLength(2);
    expect(fetchCall(fetchFn).url).toBe('/api/orders');
  });

  it('shows the server error when loading fails', async () => {
    mockFetch(jsonResponse({ error: 'Forbidden' }, 403));

    render(<OrdersModal token="t" isAdmin onClose={vi.fn()} />);

    expect(await screen.findByText('Forbidden')).toBeInTheDocument();
  });
});
