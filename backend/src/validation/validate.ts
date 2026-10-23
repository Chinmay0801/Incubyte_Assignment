import type { z } from 'zod';
import { ValidationError } from '../errors';

export interface FieldError {
  field: string;
  message: string;
}

/** Flattens Zod issues into a simple `{ field, message }` list for API clients. */
function toFieldErrors(issues: z.core.$ZodIssue[]): FieldError[] {
  return issues.flatMap((issue) => {
    if (issue.code === 'unrecognized_keys') {
      return issue.keys.map((key) => ({ field: key, message: `Unknown field "${key}"` }));
    }
    return [{ field: issue.path.join('.'), message: issue.message }];
  });
}

/** Parses `data` with `schema`, throwing a 400 ValidationError on failure. */
export function validate<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', toFieldErrors(result.error.issues));
  }
  return result.data;
}
