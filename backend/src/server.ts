import 'dotenv/config';
import { createApp } from './app';
import { loadConfig } from './config';
import { buildServices } from './container';
import { createDatabase } from './db/database';

/** Application entry point: loads config, opens the database, seeds the admin and starts listening. */
async function main(): Promise<void> {
  const config = loadConfig();
  const db = createDatabase(config.databasePath);
  const services = buildServices(db, config);

  const admin = await services.authService.ensureAdmin(config.admin);
  console.log(`Admin account ready: ${admin.email}`);

  const app = createApp({ ...services, corsOrigin: config.corsOrigin });
  const server = app.listen(config.port, () => {
    console.log(`Car Dealership API listening on http://localhost:${config.port}`);
  });

  const shutdown = () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
