import { describe, it, expect, vi } from 'vitest';
import express, { type RequestHandler } from 'express';
import request from 'supertest';
import { errorHandler, notFoundHandler } from '../../src/middleware/errorHandler';
import { requireRole } from '../../src/middleware/auth';
import { NotFoundError, ValidationError } from '../../src/errors';

/** Builds a tiny app that runs `handler` then the real error handler. */
const appWith = (...handlers: RequestHandler[]) => {
  const app = express();
  app.use(express.json({ limit: '1kb' }));
  app.post('/test', ...handlers);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

describe('errorHandler', () => {
  it('maps AppErrors to their status code and message', async () => {
    const res = await request(
      appWith(() => {
        throw new NotFoundError('Nope');
      }),
    ).post('/test');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Nope' });
  });

  it('includes validation details when present', async () => {
    const res = await request(
      appWith(() => {
        throw new ValidationError('Bad', [{ field: 'x', message: 'y' }]);
      }),
    ).post('/test');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Bad', details: [{ field: 'x', message: 'y' }] });
  });

  it('returns 413 for an oversized body', async () => {
    const res = await request(appWith((_req, res) => void res.end()))
      .post('/test')
      .send({ big: 'x'.repeat(5000) });

    expect(res.status).toBe(413);
    expect(res.body.error).toBeTypeOf('string');
  });

  it('hides unexpected errors behind a generic 500', async () => {
    const res = await request(
      appWith(() => {
        throw new Error('database exploded: secret details');
      }),
    ).post('/test');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });

  it('logs unexpected errors outside the test environment', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('NODE_ENV', 'production');
    try {
      await request(
        appWith(() => {
          throw new Error('boom');
        }),
      ).post('/test');

      expect(spy).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllEnvs();
      spy.mockRestore();
    }
  });
});

describe('requireRole', () => {
  it('returns 401 when no user has been authenticated', async () => {
    const res = await request(appWith(requireRole('admin'), (_req, res) => void res.end())).post('/test');

    expect(res.status).toBe(401);
  });

  it('lets a user with an allowed role through', async () => {
    const asAdmin: RequestHandler = (req, _res, next) => {
      req.user = { id: 1, name: 'A', email: 'a@b.c', role: 'admin' };
      next();
    };
    const res = await request(appWith(asAdmin, requireRole('admin'), (_req, res) => void res.json({ ok: true }))).post(
      '/test',
    );

    expect(res.status).toBe(200);
  });
});
