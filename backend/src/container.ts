import type Database from 'better-sqlite3';
import type { AppConfig } from './config';
import { SqliteUserRepository } from './repositories/userRepository';
import { SqliteVehicleRepository } from './repositories/vehicleRepository';
import { AuthService } from './services/authService';
import { VehicleService } from './services/vehicleService';

export interface Services {
  authService: AuthService;
  vehicleService: VehicleService;
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
  };
}
