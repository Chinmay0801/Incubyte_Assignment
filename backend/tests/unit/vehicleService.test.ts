import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabase } from '../../src/db/database';
import { SqliteVehicleRepository } from '../../src/repositories/vehicleRepository';
import { VehicleService } from '../../src/services/vehicleService';
import { ConflictError, NotFoundError, ValidationError } from '../../src/errors';

describe('VehicleService', () => {
  let db: Database.Database;
  let service: VehicleService;

  const civic = { make: 'Honda', model: 'Civic', category: 'Sedan', price: 24000, quantity: 3 };

  beforeEach(() => {
    db = createDatabase(':memory:');
    service = new VehicleService(new SqliteVehicleRepository(db));
  });

  afterEach(() => db.close());

  describe('create', () => {
    it('stores the vehicle with trimmed text fields', () => {
      const vehicle = service.create({ ...civic, make: '  Honda ', model: ' Civic ', category: ' Sedan ' });

      expect(vehicle).toMatchObject(civic);
      expect(service.getById(vehicle.id)).toEqual(vehicle);
    });
  });

  describe('list and search', () => {
    it('lists all vehicles', () => {
      service.create(civic);
      service.create({ ...civic, model: 'Accord' });

      expect(service.list()).toHaveLength(2);
    });

    it('searches using the given filters', () => {
      service.create(civic);
      service.create({ ...civic, make: 'Toyota', model: 'Camry' });

      expect(service.search({ make: 'toy' }).map((v) => v.model)).toEqual(['Camry']);
    });

    it('rejects a price range where min is greater than max', () => {
      expect(() => service.search({ minPrice: 50000, maxPrice: 10000 })).toThrow(ValidationError);
    });
  });

  describe('getById', () => {
    it('throws NotFoundError for an unknown id', () => {
      expect(() => service.getById(42)).toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('updates the given fields and keeps the rest', () => {
      const created = service.create(civic);

      const updated = service.update(created.id, { price: 23000 });

      expect(updated).toMatchObject({ ...civic, price: 23000 });
    });

    it('throws NotFoundError for an unknown id', () => {
      expect(() => service.update(42, { price: 1 })).toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('removes the vehicle', () => {
      const created = service.create(civic);

      service.delete(created.id);

      expect(() => service.getById(created.id)).toThrow(NotFoundError);
    });

    it('throws NotFoundError for an unknown id', () => {
      expect(() => service.delete(42)).toThrow(NotFoundError);
    });
  });

  describe('purchase', () => {
    it('decreases the stock by one by default', () => {
      const created = service.create(civic);

      expect(service.purchase(created.id).quantity).toBe(2);
    });

    it('decreases the stock by the requested amount', () => {
      const created = service.create(civic);

      expect(service.purchase(created.id, 3).quantity).toBe(0);
    });

    it('refuses to sell more than is in stock and leaves the stock unchanged', () => {
      const created = service.create(civic);

      expect(() => service.purchase(created.id, 4)).toThrow(ConflictError);
      expect(service.getById(created.id).quantity).toBe(3);
    });

    it('refuses to sell an out-of-stock vehicle', () => {
      const created = service.create({ ...civic, quantity: 0 });

      expect(() => service.purchase(created.id)).toThrow(/out of stock/i);
    });

    it('throws NotFoundError for an unknown id', () => {
      expect(() => service.purchase(42)).toThrow(NotFoundError);
    });
  });

  describe('restock', () => {
    it('increases the stock by the requested amount', () => {
      const created = service.create({ ...civic, quantity: 0 });

      expect(service.restock(created.id, 7).quantity).toBe(7);
    });

    it('throws NotFoundError for an unknown id', () => {
      expect(() => service.restock(42, 1)).toThrow(NotFoundError);
    });
  });
});
