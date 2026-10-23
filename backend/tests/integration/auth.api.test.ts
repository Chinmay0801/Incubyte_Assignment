import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestContext, type TestContext } from './helpers';

describe('Auth API', () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestContext();
  });

  afterEach(() => ctx.db.close());

  const valid = { name: 'Jane Doe', email: 'jane@example.com', password: 'password123' };

  describe('POST /api/auth/register', () => {
    it('registers a user and returns 201 with a token and the public user', async () => {
      const res = await request(ctx.app).post('/api/auth/register').send(valid);

      expect(res.status).toBe(201);
      expect(res.body.token).toBeTypeOf('string');
      expect(res.body.user).toEqual({
        id: expect.any(Number),
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'user',
        createdAt: expect.any(String),
      });
    });

    it('never lets a client register as admin', async () => {
      const res = await request(ctx.app)
        .post('/api/auth/register')
        .send({ ...valid, role: 'admin' });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('user');
    });

    it('returns 409 when the email is already taken', async () => {
      await request(ctx.app).post('/api/auth/register').send(valid);
      const res = await request(ctx.app)
        .post('/api/auth/register')
        .send({ ...valid, email: 'JANE@example.com' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/i);
    });

    it.each([
      ['missing name', { email: 'a@b.com', password: 'password123' }, 'name'],
      ['blank name', { ...valid, name: '   ' }, 'name'],
      ['invalid email', { ...valid, email: 'not-an-email' }, 'email'],
      ['short password', { ...valid, password: 'short' }, 'password'],
      ['non-string password', { ...valid, password: 12345678 }, 'password'],
    ])('returns 400 for %s', async (_label, body, field) => {
      const res = await request(ctx.app).post('/api/auth/register').send(body);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
      expect(res.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ field })]));
    });

    it('returns 400 for a malformed JSON body', async () => {
      const res = await request(ctx.app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"name": "oops"');

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/malformed json/i);
    });

    it('returns 400 when no body is sent', async () => {
      const res = await request(ctx.app).post('/api/auth/register');

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(ctx.app).post('/api/auth/register').send(valid);
    });

    it('returns 200 with a token for valid credentials', async () => {
      const res = await request(ctx.app)
        .post('/api/auth/login')
        .send({ email: valid.email, password: valid.password });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeTypeOf('string');
      expect(res.body.user.email).toBe(valid.email);
    });

    it('returns 401 for a wrong password', async () => {
      const res = await request(ctx.app).post('/api/auth/login').send({ email: valid.email, password: 'wrongpass' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('returns 401 for an unknown email', async () => {
      const res = await request(ctx.app)
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: valid.password });

      expect(res.status).toBe(401);
    });

    it('returns 400 when fields are missing', async () => {
      const res = await request(ctx.app).post('/api/auth/login').send({ email: valid.email });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user for a valid token', async () => {
      const token = await ctx.userToken('me@example.com');
      const res = await request(ctx.app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ email: 'me@example.com', role: 'user' });
    });

    it('returns 401 without a token', async () => {
      const res = await request(ctx.app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });
  });
});

describe('Misc routes', () => {
  it('GET /api/health reports ok', async () => {
    const ctx = createTestContext();
    const res = await request(ctx.app).get('/api/health');
    ctx.db.close();

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('unknown routes return a JSON 404', async () => {
    const ctx = createTestContext();
    const res = await request(ctx.app).get('/api/does-not-exist');
    ctx.db.close();

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
