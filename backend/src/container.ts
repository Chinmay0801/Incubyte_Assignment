import type Database from 'better-sqlite3';
import type { AppConfig } from './config';
import { SqliteOrderRepository } from './repositories/orderRepository';
import { SqliteUserRepository } from './repositories/userRepository';
import { SqliteVehicleRepository } from './repositories/vehicleRepository';
import { AuthService } from './services/authService';
import { OrderService } from './services/orderService';
import { VehicleService } from './services/vehicleService';

export interface Services {
  authService: AuthService;
  vehicleService: VehicleService;
  orderService: OrderService;
}

/** Composition root: wires repositories into services. */
export function buildServices(
  db: Database.Database,
  config: Pick<AppConfig, 'jwtSecret' | 'jwtExpiresIn'>,
  options: { saltRounds?: number } = {},
): Services {
  return {
    authService: new AuthService(new SqliteUserRepository(db), {
      jwtSecret: config.jwtSecret,
      jwtExpiresIn: config.jwtExpiresIn,
      saltRounds: options.saltRounds,
    }),
    vehicleService: new VehicleService(new SqliteVehicleRepository(db)),
    orderService: new OrderService(new SqliteOrderRepository(db)),
  };
}
