import request from 'supertest';
import type { Express } from 'express';
import type Database from 'better-sqlite3';
import { createDatabase } from '../../src/db/database';
import { createApp } from '../../src/app';
import { buildServices } from '../../src/container';
import { loadConfig } from '../../src/config';

export interface TestContext {
  app: Express;
  db: Database.Database;
  /** Registers a regular user through the API and returns their token. */
  userToken: (email?: string) => Promise<string>;
  /** Seeds an admin account and returns its token. */
  adminToken: () => Promise<string>;
}

export const sampleVehicle = { make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 21000, quantity: 4 };

export function createTestContext(): TestContext {
  const db = createDatabase(':memory:');
  const config = { ...loadConfig({}), jwtSecret: 'integration-test-secret' };
  // Low bcrypt cost keeps the suite fast; production uses the default.
  const services = buildServices(db, config, { saltRounds: 4 });
  const app = createApp({ ...services, corsOrigin: config.corsOrigin });

  const userToken = async (email = 'user@example.com') => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Regular User', email, password: 'password123' });
    return res.body.token as string;
  };

  const adminToken = async () => {
    await services.authService.ensureAdmin({ name: 'Admin', email: 'admin@example.com', password: 'adminpass1' });
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@example.com', password: 'adminpass1' });
    return res.body.token as string;
  };

  return { app, db, userToken, adminToken };
}
