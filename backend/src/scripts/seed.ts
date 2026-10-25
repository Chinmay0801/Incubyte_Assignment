import 'dotenv/config';
import { loadConfig } from '../config';
import { buildServices } from '../container';
import { createDatabase } from '../db/database';
import type { NewVehicle } from '../models/vehicle';

/** 20 popular Indian market vehicles across Hatchbacks, Sedans, SUVs, MPVs and EVs. */
const SAMPLE_VEHICLES: NewVehicle[] = [
  { make: 'Maruti Suzuki', model: 'Swift', category: 'Hatchback', price: 649000, quantity: 12, imageUrl: '/car_images/maruti-swift/01.jpg' },
  { make: 'Hyundai', model: 'i20', category: 'Premium Hatchback', price: 704000, quantity: 8, imageUrl: '/car_images/hyundai-i20/01.jpg' },
  { make: 'Tata Motors', model: 'Nexon', category: 'Compact SUV', price: 800000, quantity: 10, imageUrl: '/car_images/tata-nexon/01.jpg' },
  { make: 'Hyundai', model: 'Creta', category: 'Mid-size SUV', price: 1100000, quantity: 14, imageUrl: '/car_images/hyundai-creta/01.jpg' },
  { make: 'Mahindra', model: 'Thar', category: 'Off-road SUV', price: 1135000, quantity: 6, imageUrl: '/car_images/mahindra-thar/01.jpg' },
  { make: 'Mahindra', model: 'XUV700', category: 'Family SUV', price: 1399000, quantity: 9, imageUrl: '/car_images/mahindra-xuv700/01.png' },
  { make: 'Kia', model: 'Seltos', category: 'Mid-size SUV', price: 1090000, quantity: 7, imageUrl: '/car_images/kia-seltos/01.jpg' },
  { make: 'Toyota', model: 'Fortuner', category: 'Full-size SUV', price: 3343000, quantity: 4, imageUrl: '/car_images/toyota-fortuner/01.jpg' },
  { make: 'Honda', model: 'City', category: 'Sedan', price: 1208000, quantity: 8, imageUrl: '/car_images/honda-city/01.jpg' },
  { make: 'Škoda', model: 'Slavia', category: 'Sedan', price: 1069000, quantity: 5, imageUrl: '/car_images/skoda-slavia/01.jpg' },
  { make: 'Volkswagen', model: 'Virtus', category: 'Sedan', price: 1156000, quantity: 6, imageUrl: '/car_images/volkswagen-virtus/01.jpg' },
  { make: 'Toyota', model: 'Innova Hycross', category: 'MPV', price: 1977000, quantity: 7, imageUrl: '/car_images/toyota-innova-hycross/01.jpg' },
  { make: 'Tata Motors', model: 'Punch EV', category: 'Electric Compact SUV', price: 999000, quantity: 6, imageUrl: '/car_images/tata-punch-ev/01.jpg' },
  { make: 'MG Motor', model: 'Windsor EV', category: 'Electric Crossover', price: 1399000, quantity: 5, imageUrl: '/car_images/mg-windsor-ev/Wind.webp' },
  { make: 'Mahindra', model: 'BE 6', category: 'Electric Coupe-SUV', price: 1940000, quantity: 3, imageUrl: '/car_images/mahindra-be-6/01.jpg' },
  { make: 'Tata Motors', model: 'Curvv EV', category: 'Electric Coupe-SUV', price: 1749000, quantity: 4, imageUrl: '/car_images/tata-curvv-ev/01.jpg' },
  { make: 'Tata Motors', model: 'Harrier EV', category: 'Electric SUV', price: 2150000, quantity: 3, imageUrl: '/car_images/tata-harrier-ev/01.jpg' },
  { make: 'BYD', model: 'Seal', category: 'Electric Sedan', price: 4100000, quantity: 2, imageUrl: '/car_images/byd-seal/01.jpg' },
  { make: 'BYD', model: 'Sealion 7', category: 'Electric SUV', price: 4890000, quantity: 2, imageUrl: '/car_images/byd-sealion-7/01.jpg' },
  { make: 'MG Motor', model: 'Cyberster', category: 'Electric Roadster', price: 7500000, quantity: 0, imageUrl: '/car_images/mg-cyberster/01.jpg' },
];

async function seed(): Promise<void> {
  const config = loadConfig();
  const db = createDatabase(config.databasePath);
  const { authService, vehicleService } = buildServices(db, config);

  await authService.ensureAdmin(config.admin);

  const shouldReset = process.argv.includes('--reset');
  if (shouldReset) {
    db.prepare('DELETE FROM orders').run();
    db.prepare('DELETE FROM vehicles').run();
    console.log('Cleared existing vehicles and orders.');
  }

  if (vehicleService.list().length === 0) {
    SAMPLE_VEHICLES.forEach((vehicle) => vehicleService.create(vehicle));
    console.log(`Seeded ${SAMPLE_VEHICLES.length} Indian vehicles.`);
  } else {
    console.log('Vehicles already present - skipping vehicle seed (pass --reset to replace).');
  }

  console.log(`Admin login: ${config.admin.email}`);
  db.close();
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
