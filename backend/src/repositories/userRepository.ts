import type Database from 'better-sqlite3';
import type { NewUser, Role, User } from '../models/user';

/** Persistence contract for users. Services depend on this, not on SQLite. */
export interface UserRepository {
  create(user: NewUser): User;
  findByEmail(email: string): User | undefined;
  findById(id: number): User | undefined;
}

interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: Role;
  created_at: string;
}

const toUser = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
  passwordHash: row.password_hash,
  role: row.role,
  createdAt: row.created_at,
});

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly db: Database.Database) {}

  create(user: NewUser): User {
    const { lastInsertRowid } = this.db
      .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(user.name, user.email, user.passwordHash, user.role);
    return this.findById(Number(lastInsertRowid))!;
  }

  findByEmail(email: string): User | undefined {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
    return row && toUser(row);
  }

  findById(id: number): User | undefined {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row && toUser(row);
  }
}
