import { z } from 'zod';

const MAX_TEXT = 100;
const MAX_PRICE = 100_000_000;
const MAX_UNITS = 1_000_000;

const requiredText = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(MAX_TEXT, `${label} must be at most ${MAX_TEXT} characters`);

const hasAtMostTwoDecimals = (value: number) => Math.abs(Math.round(value * 100) - value * 100) < 1e-6;

const price = z
  .number({ error: 'Price must be a number' })
  .positive('Price must be greater than 0')
  .max(MAX_PRICE, `Price must be at most ${MAX_PRICE}`)
  .refine(hasAtMostTwoDecimals, 'Price can have at most 2 decimal places');

const units = (label: string, min: number) =>
  z
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(MAX_UNITS, `${label} must be at most ${MAX_UNITS}`);

// ---------- Auth ----------

export const registerSchema = z.object({
  name: requiredText('Name'),
  email: z.email('A valid email is required').max(254),
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
});

export const loginSchema = z.object({
  email: z.string({ error: 'Email is required' }).trim().min(1, 'Email is required'),
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});

// ---------- Vehicles ----------

export const vehicleParamsSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/, 'Vehicle id must be a positive integer')
    .transform(Number),
});

export const createVehicleSchema = z.object({
  make: requiredText('Make'),
  model: requiredText('Model'),
  category: requiredText('Category'),
  price,
  quantity: units('Quantity', 0).default(0),
  imageUrl: z.string().trim().max(500).optional(),
});

export const updateVehicleSchema = z
  .strictObject({
    make: requiredText('Make').optional(),
    model: requiredText('Model').optional(),
    category: requiredText('Category').optional(),
    price: price.optional(),
    imageUrl: z.string().trim().max(500).optional(),
    quantity: z.never({ error: 'Stock can only be changed via purchase or restock' }).optional(),
  })
  .refine((changes) => Object.values(changes).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  })
  .transform(({ quantity: _ignored, ...changes }) => changes);

/** Treats blank query-string values as "not provided". */
const blankToUndefined = (value: unknown) => (typeof value === 'string' && value.trim() === '' ? undefined : value);

const optionalTextFilter = z.preprocess(blankToUndefined, z.string('Filter must be a single value').trim().max(MAX_TEXT).optional());

const optionalPriceFilter = z.preprocess(
  blankToUndefined,
  z.coerce.number('Price filter must be a number').min(0, 'Price filter cannot be negative').optional(),
);

export const searchVehiclesSchema = z.object({
  make: optionalTextFilter,
  model: optionalTextFilter,
  category: optionalTextFilter,
  minPrice: optionalPriceFilter,
  maxPrice: optionalPriceFilter,
  sortBy: z.enum(['price_asc', 'price_desc', 'make_asc', 'newest']).optional(),
});

// ---------- Inventory ----------

export const purchaseSchema = z.object({
  quantity: units('Quantity', 1).optional(),
});

export const restockSchema = z.object({
  quantity: units('Quantity', 1),
});
