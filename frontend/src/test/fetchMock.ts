import { vi } from 'vitest';

/** Builds a minimal fetch Response for tests. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Replaces global fetch with a mock that returns the given responses in order. */
export function mockFetch(...responses: Response[]) {
  const fn = vi.fn<typeof fetch>();
  responses.forEach((response) => fn.mockResolvedValueOnce(response));
  vi.stubGlobal('fetch', fn);
  return fn;
}

/** Reads the URL and init passed to the nth fetch call. */
export function fetchCall(fn: ReturnType<typeof mockFetch>, index = 0) {
  const [url, init] = fn.mock.calls[index];
  return {
    url: String(url),
    method: init?.method ?? 'GET',
    headers: new Headers(init?.headers),
    body: init?.body ? JSON.parse(String(init.body)) : undefined,
  };
}
