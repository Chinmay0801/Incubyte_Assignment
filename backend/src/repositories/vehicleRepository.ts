import type Database from 'better-sqlite3';
import type { NewVehicle, Vehicle, VehicleSearchFilters, VehicleUpdate } from '../models/vehicle';

/** Persistence contract for vehicles. Services depend on this, not on SQLite. */
export interface VehicleRepository {
  create(vehicle: NewVehicle): Vehicle;
  findAll(): Vehicle[];
  findById(id: number): Vehicle | undefined;
  search(filters: VehicleSearchFilters): Vehicle[];
  update(id: number, changes: VehicleUpdate): Vehicle | undefined;
  delete(id: number): boolean;
  /** Atomically removes `amount` units; returns false if the vehicle is missing or stock is insufficient. */
  decrementQuantity(id: number, amount: number): boolean;
  /** Atomically adds `amount` units; returns false if the vehicle is missing. */
  incrementQuantity(id: number, amount: number): boolean;
}

interface VehicleRow {
  id: number;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

const toVehicle = (row: VehicleRow): Vehicle => ({
  id: row.id,
  make: row.make,
  model: row.model,
  category: row.category,
  price: row.price,
  quantity: row.quantity,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** Escapes LIKE wildcards so user input is matched literally. */
const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (char) => `\\${char}`);

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

/** Columns that may be changed through `update`, mapped to their SQL names. */
const UPDATABLE_COLUMNS: Record<keyof VehicleUpdate, string> = {
  make: 'make',
  model: 'model',
  category: 'category',
  price: 'price',
};

export class SqliteVehicleRepository implements VehicleRepository {
  constructor(private readonly db: Database.Database) {}

  create(vehicle: NewVehicle): Vehicle {
    const { lastInsertRowid } = this.db
      .prepare('INSERT INTO vehicles (make, model, category, price, quantity) VALUES (?, ?, ?, ?, ?)')
      .run(vehicle.make, vehicle.model, vehicle.category, vehicle.price, vehicle.quantity);
    return this.findById(Number(lastInsertRowid))!;
  }

  findAll(): Vehicle[] {
    return (this.db.prepare('SELECT * FROM vehicles ORDER BY id').all() as VehicleRow[]).map(toVehicle);
  }

  findById(id: number): Vehicle | undefined {
    const row = this.db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id) as VehicleRow | undefined;
    return row && toVehicle(row);
  }

  search(filters: VehicleSearchFilters): Vehicle[] {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.make) {
      conditions.push("make LIKE ? ESCAPE '\\'");
      params.push(`%${escapeLike(filters.make)}%`);
    }
    if (filters.model) {
      conditions.push("model LIKE ? ESCAPE '\\'");
      params.push(`%${escapeLike(filters.model)}%`);
    }
    if (filters.category) {
      conditions.push('category = ? COLLATE NOCASE');
      params.push(filters.category);
    }
    if (filters.minPrice !== undefined) {
      conditions.push('price >= ?');
      params.push(filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      conditions.push('price <= ?');
      params.push(filters.maxPrice);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = this.db.prepare(`SELECT * FROM vehicles ${where} ORDER BY id`).all(...params) as VehicleRow[];
    return rows.map(toVehicle);
  }

  update(id: number, changes: VehicleUpdate): Vehicle | undefined {
    const entries = (Object.keys(UPDATABLE_COLUMNS) as (keyof VehicleUpdate)[])
      .filter((key) => changes[key] !== undefined)
      .map((key) => [UPDATABLE_COLUMNS[key], changes[key]] as const);

    if (entries.length > 0) {
      const assignments = entries.map(([column]) => `${column} = ?`).join(', ');
      this.db
        .prepare(`UPDATE vehicles SET ${assignments}, updated_at = ${NOW} WHERE id = ?`)
        .run(...entries.map(([, value]) => value as string | number), id);
    }
    return this.findById(id);
  }

  delete(id: number): boolean {
    return this.db.prepare('DELETE FROM vehicles WHERE id = ?').run(id).changes > 0;
  }

  decrementQuantity(id: number, amount: number): boolean {
    const result = this.db
      .prepare(`UPDATE vehicles SET quantity = quantity - ?, updated_at = ${NOW} WHERE id = ? AND quantity >= ?`)
      .run(amount, id, amount);
    return result.changes > 0;
  }

  incrementQuantity(id: number, amount: number): boolean {
    const result = this.db
      .prepare(`UPDATE vehicles SET quantity = quantity + ?, updated_at = ${NOW} WHERE id = ?`)
      .run(amount, id);
    return result.changes > 0;
  }
}
