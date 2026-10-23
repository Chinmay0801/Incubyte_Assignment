import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import type Database from 'better-sqlite3';
import { createDatabase } from '../../src/db/database';
import { SqliteUserRepository } from '../../src/repositories/userRepository';
import { AuthService } from '../../src/services/authService';
import { ConflictError, UnauthorizedError } from '../../src/errors';

const SECRET = 'test-secret';

describe('AuthService', () => {
  let db: Database.Database;
  let users: SqliteUserRepository;
  let auth: AuthService;

  const credentials = { name: 'Jane Doe', email: 'Jane@Example.com', password: 'secret123' };

  beforeEach(() => {
    db = createDatabase(':memory:');
    users = new SqliteUserRepository(db);
    auth = new AuthService(users, { jwtSecret: SECRET, jwtExpiresIn: '1h' });
  });

  afterEach(() => db.close());

  describe('register', () => {
    it('creates a regular user and returns a token plus the public profile', async () => {
      const result = await auth.register(credentials);

      expect(result.token).toBeTypeOf('string');
      expect(result.user).toMatchObject({ name: 'Jane Doe', email: 'jane@example.com', role: 'user' });
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('normalises the email (trim + lowercase) before storing it', async () => {
      await auth.register({ ...credentials, email: '  MIXED@Case.COM ' });

      expect(users.findByEmail('mixed@case.com')).toBeDefined();
    });

    it('stores a bcrypt hash, never the plain password', async () => {
      await auth.register(credentials);
      const stored = users.findByEmail('jane@example.com')!;

      expect(stored.passwordHash).not.toBe(credentials.password);
      expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it('rejects an email that is already registered (case-insensitive)', async () => {
      await auth.register(credentials);

      await expect(auth.register({ ...credentials, email: 'JANE@example.com' })).rejects.toBeInstanceOf(ConflictError);
    });

    it('reports a conflict (not a crash) when the same email registers concurrently', async () => {
      const results = await Promise.allSettled([auth.register(credentials), auth.register(credentials)]);

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      const rejected = results.find((r) => r.status === 'rejected') as PromiseRejectedResult;
      expect(rejected.reason).toBeInstanceOf(ConflictError);
    });

    it('issues a token that encodes the user id and role', async () => {
      const { token, user } = await auth.register(credentials);
      const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;

      expect(payload.sub).toBe(String(user.id));
      expect(payload.role).toBe('user');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await auth.register(credentials);
    });

    it('returns a token for valid credentials (email is case-insensitive)', async () => {
      const result = await auth.login({ email: 'JANE@EXAMPLE.COM', password: 'secret123' });

      expect(result.token).toBeTypeOf('string');
      expect(result.user.email).toBe('jane@example.com');
    });

    it('rejects a wrong password', async () => {
      await expect(auth.login({ email: 'jane@example.com', password: 'wrong-pass' })).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });

    it('rejects an unknown email with the same generic error', async () => {
      const error = await auth.login({ email: 'ghost@example.com', password: 'secret123' }).catch((e) => e);

      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('Invalid email or password');
    });
  });

  describe('verifyToken', () => {
    it('returns the current user for a valid token', async () => {
      const { token, user } = await auth.register(credentials);

      expect(auth.verifyToken(token)).toEqual({ id: user.id, name: user.name, email: user.email, role: 'user' });
    });

    it('rejects a malformed token', () => {
      expect(() => auth.verifyToken('not-a-token')).toThrow(UnauthorizedError);
    });

    it('rejects a token signed with another secret', async () => {
      const { user } = await auth.register(credentials);
      const forged = jwt.sign({ sub: String(user.id), role: 'admin' }, 'other-secret');

      expect(() => auth.verifyToken(forged)).toThrow(UnauthorizedError);
    });

    it('rejects an expired token', async () => {
      const { user } = await auth.register(credentials);
      const expired = jwt.sign({ sub: String(user.id), role: 'user' }, SECRET, { expiresIn: -10 });

      expect(() => auth.verifyToken(expired)).toThrow(UnauthorizedError);
    });

    it('rejects a token for a user that no longer exists', () => {
      const orphan = jwt.sign({ sub: '999', role: 'admin' }, SECRET);

      expect(() => auth.verifyToken(orphan)).toThrow(UnauthorizedError);
    });

    it('takes the role from the database, not from the token claims', async () => {
      const { user } = await auth.register(credentials);
      const tampered = jwt.sign({ sub: String(user.id), role: 'admin' }, SECRET);

      expect(auth.verifyToken(tampered).role).toBe('user');
    });
  });

  it('propagates unexpected persistence errors unchanged', async () => {
    const failure = new Error('disk full');
    const failingRepo = { ...users, findByEmail: () => undefined, findById: () => undefined, create: () => { throw failure; } };
    const failingAuth = new AuthService(failingRepo, { jwtSecret: SECRET, jwtExpiresIn: '1h', saltRounds: 4 });

    await expect(failingAuth.register(credentials)).rejects.toBe(failure);
  });

  describe('ensureAdmin', () => {
    it('creates an admin account when it does not exist', async () => {
      const admin = await auth.ensureAdmin({ name: 'Admin', email: 'admin@example.com', password: 'adminpass' });

      expect(admin.role).toBe('admin');
      const { user } = await auth.login({ email: 'admin@example.com', password: 'adminpass' });
      expect(user.role).toBe('admin');
    });

    it('is idempotent - calling it twice does not create a duplicate', async () => {
      const first = await auth.ensureAdmin({ name: 'Admin', email: 'admin@example.com', password: 'adminpass' });
      const second = await auth.ensureAdmin({ name: 'Admin', email: 'admin@example.com', password: 'adminpass' });

      expect(second.id).toBe(first.id);
    });
  });
});
