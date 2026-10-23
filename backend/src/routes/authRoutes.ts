import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import type { AuthService } from '../services/authService';
import { loginSchema, registerSchema } from '../validation/schemas';
import { validate } from '../validation/validate';

export function createAuthRouter(auth: AuthService): Router {
  const router = Router();

  router.post('/register', async (req, res) => {
    const input = validate(registerSchema, req.body ?? {});
    res.status(201).json(await auth.register(input));
  });

  router.post('/login', async (req, res) => {
    const input = validate(loginSchema, req.body ?? {});
    res.json(await auth.login(input));
  });

  router.get('/me', authenticate(auth), (req, res) => {
    res.json({ user: req.user });
  });

  return router;
}
