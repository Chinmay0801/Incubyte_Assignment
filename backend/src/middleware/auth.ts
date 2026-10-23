import type { RequestHandler } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors';
import type { Role } from '../models/user';
import type { AuthService } from '../services/authService';

const BEARER = /^Bearer\s+(\S+)$/i;

/** Requires a valid `Authorization: Bearer <jwt>` header and attaches `req.user`. */
export const authenticate =
  (auth: AuthService): RequestHandler =>
  (req, _res, next) => {
    const match = req.headers.authorization?.match(BEARER);
    if (!match) {
      throw new UnauthorizedError('Authentication required');
    }
    req.user = auth.verifyToken(match[1]);
    next();
  };

/** Allows the request through only if the authenticated user has one of `roles`. Use after `authenticate`. */
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Admin access required');
    }
    next();
  };
