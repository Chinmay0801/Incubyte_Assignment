import cors from 'cors';
import express, { type Express } from 'express';
import type { Services } from './container';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createAuthRouter } from './routes/authRoutes';
import { createVehicleRouter } from './routes/vehicleRoutes';

export interface AppOptions extends Services {
  /** One origin or a comma-separated list of origins allowed by CORS. */
  corsOrigin: string;
}

/** Builds the Express application. Dependencies are injected so tests can use their own database. */
export function createApp({ authService, vehicleService, corsOrigin }: AppOptions): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigin.split(',').map((origin) => origin.trim()) }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', createAuthRouter(authService));
  app.use('/api/vehicles', createVehicleRouter(vehicleService, authService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
