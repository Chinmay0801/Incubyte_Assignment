import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchCall, jsonResponse, mockFetch } from '../test/fetchMock';
import { fetchCurrentUser, login, register } from './auth';
import {
  createVehicle,
  deleteVehicle,
  downloadInventoryCsv,
  getAllOrders,
  getMyOrders,
  listVehicles,
  purchaseVehicle,
  restockVehicle,
  searchVehicles,
  updateVehicle,
} from './vehicles';

afterEach(() => vi.unstubAllGlobals());

describe('auth endpoints', () => {
  it('register posts name, email and password', async () => {
    const fetchFn = mockFetch(jsonResponse({ token: 't', user: {} }, 201));

    await register({ name: 'Jane', email: 'j@x.com', password: 'password1' });

    expect(fetchCall(fetchFn)).toMatchObject({
      url: '/api/auth/register',
      method: 'POST',
      body: { name: 'Jane', email: 'j@x.com', password: 'password1' },
    });
  });

  it('login posts the credentials', async () => {
    const fetchFn = mockFetch(jsonResponse({ token: 't', user: {} }));

    await login({ email: 'j@x.com', password: 'password1' });

    expect(fetchCall(fetchFn)).toMatchObject({ url: '/api/auth/login', method: 'POST' });
  });

  it('fetchCurrentUser unwraps the user', async () => {
    const fetchFn = mockFetch(jsonResponse({ user: { id: 1, name: 'J' } }));

    await expect(fetchCurrentUser('tok')).resolves.toEqual({ id: 1, name: 'J' });
    expect(fetchCall(fetchFn).headers.get('Authorization')).toBe('Bearer tok');
  });
});

describe('vehicle endpoints', () => {
  it('listVehicles GETs /api/vehicles with the token', async () => {
    const fetchFn = mockFetch(jsonResponse([]));

    await listVehicles('tok');

    const call = fetchCall(fetchFn);
    expect(call.url).toBe('/api/vehicles');
    expect(call.headers.get('Authorization')).toBe('Bearer tok');
  });

  it('searchVehicles builds a query string from non-empty filters only', async () => {
    const fetchFn = mockFetch(jsonResponse([]));

    await searchVehicles('tok', { make: ' Toyota ', model: '', category: 'SUV', minPrice: '1000', maxPrice: '  ' });

    expect(fetchCall(fetchFn).url).toBe('/api/vehicles/search?make=Toyota&category=SUV&minPrice=1000');
  });

  it('createVehicle POSTs the vehicle', async () => {
    const fetchFn = mockFetch(jsonResponse({ id: 1 }, 201));
    const input = { make: 'A', model: 'B', category: 'C', price: 1, quantity: 2 };

    await createVehicle('tok', input);

    expect(fetchCall(fetchFn)).toMatchObject({ url: '/api/vehicles', method: 'POST', body: input });
  });

  it('updateVehicle PUTs the changes', async () => {
    const fetchFn = mockFetch(jsonResponse({ id: 3 }));

    await updateVehicle('tok', 3, { price: 99 });

    expect(fetchCall(fetchFn)).toMatchObject({ url: '/api/vehicles/3', method: 'PUT', body: { price: 99 } });
  });

  it('deleteVehicle sends DELETE', async () => {
    const fetchFn = mockFetch(jsonResponse(null, 204));

    await deleteVehicle('tok', 3);

    expect(fetchCall(fetchFn)).toMatchObject({ url: '/api/vehicles/3', method: 'DELETE' });
  });

  it('purchaseVehicle POSTs the quantity (default 1)', async () => {
    const fetchFn = mockFetch(jsonResponse({ id: 3 }), jsonResponse({ id: 3 }));

    await purchaseVehicle('tok', 3);
    await purchaseVehicle('tok', 3, 2);

    expect(fetchCall(fetchFn, 0)).toMatchObject({ url: '/api/vehicles/3/purchase', method: 'POST', body: { quantity: 1 } });
    expect(fetchCall(fetchFn, 1).body).toEqual({ quantity: 2 });
  });

  it('restockVehicle POSTs the quantity', async () => {
    const fetchFn = mockFetch(jsonResponse({ id: 3 }));

    await restockVehicle('tok', 3, 5);

    expect(fetchCall(fetchFn)).toMatchObject({ url: '/api/vehicles/3/restock', method: 'POST', body: { quantity: 5 } });
  });
});

describe('order and export endpoints', () => {
  it('getMyOrders GETs the signed-in user’s orders', async () => {
    const fetchFn = mockFetch(jsonResponse([]));

    await getMyOrders('tok');

    expect(fetchCall(fetchFn)).toMatchObject({ url: '/api/orders/my', method: 'GET' });
    expect(fetchCall(fetchFn).headers.get('Authorization')).toBe('Bearer tok');
  });

  it('getAllOrders GETs the sales ledger', async () => {
    const fetchFn = mockFetch(jsonResponse({ orders: [], totalRevenue: 0, totalUnitsSold: 0 }));

    await getAllOrders('tok');

    expect(fetchCall(fetchFn).url).toBe('/api/orders');
  });

  it('downloadInventoryCsv saves the CSV through a temporary link', async () => {
    const fetchFn = mockFetch(new Response('a,b', { status: 200 }));
    const createObjectURL = vi.fn(() => 'blob:csv');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL = createObjectURL;
      static revokeObjectURL = revokeObjectURL;
    });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await downloadInventoryCsv('tok');

    expect(fetchCall(fetchFn).headers.get('Authorization')).toBe('Bearer tok');
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv');
  });

  it('downloadInventoryCsv throws when the server refuses', async () => {
    mockFetch(new Response('', { status: 403 }));

    await expect(downloadInventoryCsv('tok')).rejects.toThrow('Failed to export inventory CSV');
  });
});
