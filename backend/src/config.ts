export interface AppConfig {
  port: number;
  databasePath: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  corsOrigin: string;
  admin: { name: string; email: string; password: string };
}

const DEV_JWT_SECRET = 'dev-only-insecure-secret';

/** Builds the app configuration from environment variables, validating as it goes. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number(env.PORT ?? 4000);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT value: "${env.PORT}"`);
  }

  if (env.NODE_ENV === 'production' && !env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in production');
  }

  return {
    port,
    databasePath: env.DATABASE_PATH ?? './data/dealership.db',
    jwtSecret: env.JWT_SECRET ?? DEV_JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN ?? '1d',
    corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:5173',
    admin: {
      name: env.ADMIN_NAME ?? 'Administrator',
      email: env.ADMIN_EMAIL ?? 'admin@dealership.com',
      password: env.ADMIN_PASSWORD ?? 'Admin@123',
    },
  };
}
