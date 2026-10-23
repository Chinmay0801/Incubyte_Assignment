import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from './client';
import { fetchCall, jsonResponse, mockFetch } from '../test/fetchMock';

describe('apiRequest', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('performs a GET and returns parsed JSON', async () => {
    const fetchFn = mockFetch(jsonResponse({ hello: 'world' }));

    await expect(apiRequest('/api/thing')).resolves.toEqual({ hello: 'world' });
    expect(fetchCall(fetchFn)).toMatchObject({ url: '/api/thing', method: 'GET' });
  });

  it('sends a JSON body and the bearer token', async () => {
    const fetchFn = mockFetch(jsonResponse({ ok: true }, 201));

    await apiRequest('/api/thing', { method: 'POST', body: { a: 1 }, token: 'abc' });

    const call = fetchCall(fetchFn);
    expect(call.method).toBe('POST');
    expect(call.body).toEqual({ a: 1 });
    expect(call.headers.get('Content-Type')).toBe('application/json');
    expect(call.headers.get('Authorization')).toBe('Bearer abc');
  });

  it('omits the Authorization header when there is no token', async () => {
    const fetchFn = mockFetch(jsonResponse({}));

    await apiRequest('/api/thing');

    expect(fetchCall(fetchFn).headers.has('Authorization')).toBe(false);
  });

  it('returns undefined for 204 No Content', async () => {
    mockFetch(jsonResponse(null, 204));

    await expect(apiRequest('/api/thing', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('throws an ApiError with the server message, status and details', async () => {
    mockFetch(jsonResponse({ error: 'Validation failed', details: [{ field: 'price', message: 'Too low' }] }, 400));

    const error = await apiRequest('/api/thing').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      message: 'Validation failed',
      details: [{ field: 'price', message: 'Too low' }],
    });
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    mockFetch(new Response('<html>Bad gateway</html>', { status: 502 }));

    await expect(apiRequest('/api/thing')).rejects.toMatchObject({ status: 502, message: 'Request failed (502)' });
  });

  it('reports network failures as status 0 with a helpful message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(apiRequest('/api/thing')).rejects.toMatchObject({
      status: 0,
      message: expect.stringMatching(/can't reach the server/i),
    });
  });
});
