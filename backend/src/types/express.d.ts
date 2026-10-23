import type { AuthenticatedUser } from '../services/authService';

declare global {
  namespace Express {
    interface Request {
      /** Set by the `authenticate` middleware. */
      user?: AuthenticatedUser;
    }
  }
}

export {};
