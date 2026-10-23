import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type Database from 'better-sqlite3';
import { createDatabase } from '../../src/db/database';
import { SqliteVehicleRepository } from '../../src/repositories/vehicleRepository';
import type { NewVehicle } from '../../src/models/vehicle';

describe('SqliteVehicleRepository', () => {
  let db: Database.Database;
  let repo: SqliteVehicleRepository;

  const civic: NewVehicle = { make: 'Honda', model: 'Civic', category: 'Sedan', price: 24000, quantity: 5 };
  const crv: NewVehicle = { make: 'Honda', model: 'CR-V', category: 'SUV', price: 32000, quantity: 2 };
  const mustang: NewVehicle = { make: 'Ford', model: 'Mustang', category: 'Coupe', price: 45000, quantity: 0 };

  beforeEach(() => {
    db = createDatabase(':memory:');
    repo = new SqliteVehicleRepository(db);
  });

  afterEach(() => db.close());

  describe('create / find', () => {
    it('creates a vehicle with a generated unique id', () => {
      const a = repo.create(civic);
      const b = repo.create(crv);

      expect(a).toMatchObject(civic);
      expect(a.id).toBeTypeOf('number');
      expect(a.id).not.toBe(b.id);
    });

    it('finds a vehicle by id', () => {
      const created = repo.create(civic);

      expect(repo.findById(created.id)).toEqual(created);
      expect(repo.findById(12345)).toBeUndefined();
    });

    it('lists all vehicles ordered by id', () => {
      repo.create(civic);
      repo.create(crv);

      expect(repo.findAll().map((v) => v.model)).toEqual(['Civic', 'CR-V']);
    });
  });

  describe('search', () => {
    beforeEach(() => {
      repo.create(civic);
      repo.create(crv);
      repo.create(mustang);
    });

    it('returns everything when no filters are given', () => {
      expect(repo.search({})).toHaveLength(3);
    });

    it('matches make partially and case-insensitively', () => {
      expect(repo.search({ make: 'hon' }).map((v) => v.model)).toEqual(['Civic', 'CR-V']);
    });

    it('matches model partially and case-insensitively', () => {
      expect(repo.search({ model: 'must' }).map((v) => v.model)).toEqual(['Mustang']);
    });

    it('matches category exactly, ignoring case', () => {
      expect(repo.search({ category: 'suv' }).map((v) => v.model)).toEqual(['CR-V']);
      expect(repo.search({ category: 'su' })).toEqual([]);
    });

    it('filters by an inclusive price range', () => {
      expect(repo.search({ minPrice: 24000, maxPrice: 32000 }).map((v) => v.model)).toEqual(['Civic', 'CR-V']);
      expect(repo.search({ minPrice: 40000 }).map((v) => v.model)).toEqual(['Mustang']);
      expect(repo.search({ maxPrice: 23999 })).toEqual([]);
    });

    it('combines multiple filters with AND', () => {
      expect(repo.search({ make: 'honda', maxPrice: 30000 }).map((v) => v.model)).toEqual(['Civic']);
    });

    it('treats LIKE wildcards in user input literally', () => {
      expect(repo.search({ make: '%' })).toEqual([]);
      expect(repo.search({ model: '_' })).toEqual([]);
    });
  });

  describe('update / delete', () => {
    it('updates only the provided fields', () => {
      const created = repo.create(civic);

      const updated = repo.update(created.id, { price: 25000, model: 'Civic Si' });

      expect(updated).toMatchObject({ ...civic, price: 25000, model: 'Civic Si', id: created.id });
      expect(repo.findById(created.id)).toEqual(updated);
    });

    it('returns undefined when updating a missing vehicle', () => {
      expect(repo.update(999, { price: 1 })).toBeUndefined();
    });

    it('deletes a vehicle and reports whether it existed', () => {
      const created = repo.create(civic);

      expect(repo.delete(created.id)).toBe(true);
      expect(repo.findById(created.id)).toBeUndefined();
      expect(repo.delete(created.id)).toBe(false);
    });
  });

  describe('stock changes', () => {
    it('decrements stock when enough is available', () => {
      const created = repo.create(civic);

      expect(repo.decrementQuantity(created.id, 2)).toBe(true);
      expect(repo.findById(created.id)?.quantity).toBe(3);
    });

    it('refuses to decrement below zero and leaves stock untouched', () => {
      const created = repo.create(crv);

      expect(repo.decrementQuantity(created.id, 3)).toBe(false);
      expect(repo.findById(created.id)?.quantity).toBe(2);
    });

    it('increments stock', () => {
      const created = repo.create(mustang);

      expect(repo.incrementQuantity(created.id, 10)).toBe(true);
      expect(repo.findById(created.id)?.quantity).toBe(10);
    });

    it('reports false when changing stock of a missing vehicle', () => {
      expect(repo.incrementQuantity(999, 1)).toBe(false);
      expect(repo.decrementQuantity(999, 1)).toBe(false);
    });
  });
});
