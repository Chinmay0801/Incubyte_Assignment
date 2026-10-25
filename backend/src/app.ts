import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express, { type Express } from 'express';
import type { Services } from './container';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createAuthRouter } from './routes/authRoutes';
import { createDocsRouter } from './routes/docsRoute';
import { createOrderRouter } from './routes/orderRoutes';
import { createVehicleRouter } from './routes/vehicleRoutes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AppOptions extends Services {
  /** One origin or a comma-separated list of origins allowed by CORS. */
  corsOrigin: string;
}

/** Builds the Express application. Dependencies are injected so tests can use their own database. */
export function createApp({ authService, vehicleService, orderService, corsOrigin }: AppOptions): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigin.split(',').map((origin) => origin.trim()) }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/docs', createDocsRouter());
  app.use('/api/auth', createAuthRouter(authService));
  app.use('/api/vehicles', createVehicleRouter(vehicleService, authService, orderService));
  if (orderService) {
    app.use('/api/orders', createOrderRouter(orderService, authService));
  }

  // In production (e.g. Docker) the built SPA, car photos included, is served from the same origin.
  // During development Vite serves the frontend instead, so this is skipped when there is no build.
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
