import type Database from 'better-sqlite3';
import type { CreateOrderInput, Order } from '../models/order';

export interface OrderRepository {
  create(input: CreateOrderInput): Order;
  findByUserId(userId: number): Order[];
  findAll(): Order[];
}

interface OrderRow {
  id: number;
  user_id: number;
  vehicle_id: number;
  make: string;
  model: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  purchased_at: string;
  user_name?: string;
  user_email?: string;
}

const toOrder = (row: OrderRow): Order => ({
  id: row.id,
  userId: row.user_id,
  vehicleId: row.vehicle_id,
  make: row.make,
  model: row.model,
  category: row.category,
  quantity: row.quantity,
  unitPrice: row.unit_price,
  totalPrice: row.total_price,
  purchasedAt: row.purchased_at,
  ...(row.user_name ? { userName: row.user_name } : {}),
  ...(row.user_email ? { userEmail: row.user_email } : {}),
});

export class SqliteOrderRepository implements OrderRepository {
  constructor(private readonly db: Database.Database) {}

  create(input: CreateOrderInput): Order {
    const totalPrice = Number((input.quantity * input.unitPrice).toFixed(2));
    const result = this.db
      .prepare(
        'INSERT INTO orders (user_id, vehicle_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
      )
      .run(input.userId, input.vehicleId, input.quantity, input.unitPrice, totalPrice);

    return this.findById(Number(result.lastInsertRowid))!;
  }

  findById(id: number): Order | undefined {
    const row = this.db
      .prepare(
        `SELECT o.*, v.make, v.model, v.category, u.name AS user_name, u.email AS user_email
         FROM orders o
         JOIN vehicles v ON v.id = o.vehicle_id
         JOIN users u ON u.id = o.user_id
         WHERE o.id = ?`,
      )
      .get(id) as OrderRow | undefined;

    return row && toOrder(row);
  }

  findByUserId(userId: number): Order[] {
    const rows = this.db
      .prepare(
        `SELECT o.*, v.make, v.model, v.category
         FROM orders o
         JOIN vehicles v ON v.id = o.vehicle_id
         WHERE o.user_id = ?
         ORDER BY o.id DESC`,
      )
      .all(userId) as OrderRow[];

    return rows.map(toOrder);
  }

  findAll(): Order[] {
    const rows = this.db
      .prepare(
        `SELECT o.*, v.make, v.model, v.category, u.name AS user_name, u.email AS user_email
         FROM orders o
         JOIN vehicles v ON v.id = o.vehicle_id
         JOIN users u ON u.id = o.user_id
         ORDER BY o.id DESC`,
      )
      .all() as OrderRow[];

    return rows.map(toOrder);
  }
}
