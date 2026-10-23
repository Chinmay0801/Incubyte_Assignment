import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Schema for the application. Every statement is idempotent so it can run
 * on every start-up without a separate migration tool.
 */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    make       TEXT    NOT NULL,
    model      TEXT    NOT NULL,
    category   TEXT    NOT NULL,
    price      REAL    NOT NULL CHECK (price >= 0),
    quantity   INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
`;

/**
 * Opens (creating if necessary) the SQLite database at `filePath` and applies
 * the schema. Pass `':memory:'` only in tests - the running app always uses a file.
 */
export function createDatabase(filePath: string): Database.Database {
  if (filePath !== ':memory:') {
    fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  }

  const db = new Database(filePath);
  db.pragma('foreign_keys = ON');
  if (filePath !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }
  db.exec(SCHEMA);
  return db;
}
