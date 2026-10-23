import { describe, it, expect } from 'vitest';
import { loadConfig } from '../../src/config';

describe('loadConfig', () => {
  it('provides sensible development defaults', () => {
    const config = loadConfig({});

    expect(config).toMatchObject({
      port: 4000,
      databasePath: './data/dealership.db',
      jwtExpiresIn: '1d',
      corsOrigin: 'http://localhost:5173',
    });
    expect(config.jwtSecret.length).toBeGreaterThan(0);
  });

  it('reads values from the environment', () => {
    const config = loadConfig({
      PORT: '5000',
      DATABASE_PATH: '/tmp/x.db',
      JWT_SECRET: 'abc',
      JWT_EXPIRES_IN: '2h',
      CORS_ORIGIN: 'https://cars.example.com',
      ADMIN_EMAIL: 'boss@example.com',
      ADMIN_PASSWORD: 'boss-pass',
    });

    expect(config).toMatchObject({
      port: 5000,
      databasePath: '/tmp/x.db',
      jwtSecret: 'abc',
      jwtExpiresIn: '2h',
      corsOrigin: 'https://cars.example.com',
      admin: { email: 'boss@example.com', password: 'boss-pass' },
    });
  });

  it('refuses to start in production without an explicit JWT secret', () => {
    expect(() => loadConfig({ NODE_ENV: 'production' })).toThrow(/JWT_SECRET/);
  });

  it('rejects an invalid port', () => {
    expect(() => loadConfig({ PORT: 'abc' })).toThrow(/PORT/);
  });
});
