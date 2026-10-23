import type { FieldError } from '../types';

/** Base URL of the API. Empty in development, where Vite proxies /api to the backend. */
const API_BASE_URL: string = import.meta.env.VITE_API_URL ?? '';

/** An error returned by the API (or status 0 when the server could not be reached). */
export class ApiError extends Error {
  readonly status: number;
  readonly details?: FieldError[];

  constructor(status: number, message: string, details?: FieldError[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

/** Thin fetch wrapper: sends JSON, attaches the bearer token and turns error responses into ApiErrors. */
export async function apiRequest<T>(path: string, { method = 'GET', body, token }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check that the API is running and try again.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => undefined);
  if (!response.ok) {
    throw new ApiError(response.status, payload?.error ?? `Request failed (${response.status})`, payload?.details);
  }
  return payload as T;
}
