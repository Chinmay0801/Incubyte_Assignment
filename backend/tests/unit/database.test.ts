import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createDatabase } from '../../src/db/database';

describe('createDatabase', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dealership-db-'));

  afterAll(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  it('creates a persistent database file (including missing folders) with the schema', () => {
    const file = path.join(tmpDir, 'nested', 'test.db');
    const db = createDatabase(file);

    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => (row as { name: string }).name);
    db.close();

    expect(fs.existsSync(file)).toBe(true);
    expect(tables).toEqual(expect.arrayContaining(['users', 'vehicles']));
  });

  it('keeps data between connections', () => {
    const file = path.join(tmpDir, 'persist.db');
    const first = createDatabase(file);
    first
      .prepare('INSERT INTO vehicles (make, model, category, price, quantity) VALUES (?, ?, ?, ?, ?)')
      .run('Toyota', 'Corolla', 'Sedan', 20000, 1);
    first.close();

    const second = createDatabase(file);
    const count = (second.prepare('SELECT COUNT(*) AS n FROM vehicles').get() as { n: number }).n;
    second.close();

    expect(count).toBe(1);
  });

  it('enforces non-negative stock with a CHECK constraint', () => {
    const db = createDatabase(':memory:');
    const insert = () =>
      db
        .prepare('INSERT INTO vehicles (make, model, category, price, quantity) VALUES (?, ?, ?, ?, ?)')
        .run('A', 'B', 'C', 1, -1);

    expect(insert).toThrow();
    db.close();
  });
});
