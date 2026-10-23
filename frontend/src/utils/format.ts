import { ApiError } from '../api/client';
import type { FieldError } from '../types';

const wholeDollars = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const withCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

/** "$28,400" for whole amounts, "$19,999.50" when there are cents. */
export const formatPrice = (price: number): string =>
  Number.isInteger(price) ? wholeDollars.format(price) : withCents.format(price);

/** Zero-padded stock number shown on the window sticker, e.g. 7 -> "0007". */
export const formatStockNumber = (id: number): string => String(id).padStart(4, '0');

/** A human-readable message for any thrown value. */
export const errorMessage = (error: unknown): string =>
  error instanceof Error && error.message ? error.message : 'Something went wrong. Try again.';

/** Field-level errors from an API validation failure, keyed by field name. */
export const fieldErrorsFrom = (error: unknown): Record<string, string> =>
  error instanceof ApiError && error.details
    ? Object.fromEntries(error.details.filter((d: FieldError) => d.field).map((d) => [d.field, d.message]))
    : {};
