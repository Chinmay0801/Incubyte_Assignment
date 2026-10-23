import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError, NotFoundError } from '../errors';

/** Errors raised by express.json() carry a `type` and an HTTP `status`. */
interface BodyParserError {
  type?: string;
  status?: number;
}

export const notFoundHandler: RequestHandler = (req) => {
  throw new NotFoundError(`Route ${req.method} ${req.path} not found`);
};

/** Converts any thrown error into a consistent `{ error, details? }` JSON response. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, ...(err.details !== undefined && { details: err.details }) });
    return;
  }

  const { type, status } = (err ?? {}) as BodyParserError;
  if (type === 'entity.parse.failed') {
    res.status(400).json({ error: 'Malformed JSON body' });
    return;
  }
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ error: (err as Error).message });
    return;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  res.status(500).json({ error: 'Internal server error' });
};
