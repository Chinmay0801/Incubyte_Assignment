import 'dotenv/config';
import { loadConfig } from '../config';
import { buildServices } from '../container';
import { createDatabase } from '../db/database';
import type { NewVehicle } from '../models/vehicle';

/** Sample inventory so the UI has something to show on first run. */
const SAMPLE_VEHICLES: NewVehicle[] = [
  { make: 'Toyota', model: 'Camry', category: 'Sedan', price: 28400, quantity: 6 },
  { make: 'Honda', model: 'Civic', category: 'Sedan', price: 24650, quantity: 4 },
  { make: 'Tesla', model: 'Model 3', category: 'Electric', price: 38990, quantity: 3 },
  { make: 'Ford', model: 'F-150', category: 'Truck', price: 36770, quantity: 5 },
  { make: 'Jeep', model: 'Wrangler', category: 'SUV', price: 33190, quantity: 2 },
  { make: 'BMW', model: 'M4', category: 'Coupe', price: 79100, quantity: 1 },
  { make: 'Porsche', model: '911 Carrera', category: 'Coupe', price: 116050, quantity: 0 },
  { make: 'Hyundai', model: 'Tucson', category: 'SUV', price: 29200, quantity: 7 },
  { make: 'Kia', model: 'EV6', category: 'Electric', price: 42600, quantity: 2 },
  { make: 'Mazda', model: 'MX-5 Miata', category: 'Convertible', price: 29930, quantity: 0 },
  { make: 'Chevrolet', model: 'Tahoe', category: 'SUV', price: 58200, quantity: 3 },
  { make: 'Subaru', model: 'Outback', category: 'Wagon', price: 30240, quantity: 4 },
];

async function seed(): Promise<void> {
  const config = loadConfig();
  const db = createDatabase(config.databasePath);
  const { authService, vehicleService } = buildServices(db, config);

  await authService.ensureAdmin(config.admin);

  if (vehicleService.list().length === 0) {
    SAMPLE_VEHICLES.forEach((vehicle) => vehicleService.create(vehicle));
    console.log(`Seeded ${SAMPLE_VEHICLES.length} vehicles.`);
  } else {
    console.log('Vehicles already present - skipping vehicle seed.');
  }

  console.log(`Admin login: ${config.admin.email}`);
  db.close();
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
