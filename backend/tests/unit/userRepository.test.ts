import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabase } from '../../src/db/database';
import { SqliteUserRepository } from '../../src/repositories/userRepository';

describe('SqliteUserRepository', () => {
  let db: Database.Database;
  let repo: SqliteUserRepository;

  beforeEach(() => {
    db = createDatabase(':memory:');
    repo = new SqliteUserRepository(db);
  });

  afterEach(() => db.close());

  const newUser = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    passwordHash: 'hashed-password',
    role: 'user' as const,
  };

  it('creates a user and returns it with a generated id', () => {
    const user = repo.create(newUser);

    expect(user.id).toBeTypeOf('number');
    expect(user).toMatchObject(newUser);
    expect(user.createdAt).toBeTruthy();
  });

  it('assigns a unique id to each user', () => {
    const a = repo.create(newUser);
    const b = repo.create({ ...newUser, email: 'other@example.com' });

    expect(a.id).not.toBe(b.id);
  });

  it('finds a user by email, ignoring case', () => {
    const created = repo.create(newUser);

    expect(repo.findByEmail('JANE@example.com')).toEqual(created);
  });

  it('returns undefined when the email is unknown', () => {
    expect(repo.findByEmail('nobody@example.com')).toBeUndefined();
  });

  it('finds a user by id', () => {
    const created = repo.create(newUser);

    expect(repo.findById(created.id)).toEqual(created);
    expect(repo.findById(9999)).toBeUndefined();
  });

  it('rejects a duplicate email at the database level, ignoring case', () => {
    repo.create(newUser);

    expect(() => repo.create({ ...newUser, email: 'JANE@EXAMPLE.COM' })).toThrow();
  });
});
