import type { Order, CreateOrderInput } from '../models/order';
import type { OrderRepository } from '../repositories/orderRepository';

export interface OrderSummary {
  orders: Order[];
  totalRevenue: number;
  totalUnitsSold: number;
}

export class OrderService {
  constructor(private readonly orders: OrderRepository) {}

  recordPurchase(input: CreateOrderInput): Order {
    return this.orders.create(input);
  }

  listUserOrders(userId: number): Order[] {
    return this.orders.findByUserId(userId);
  }

  listAllOrders(): OrderSummary {
    const list = this.orders.findAll();
    const totalRevenue = Number(list.reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2));
    const totalUnitsSold = list.reduce((sum, o) => sum + o.quantity, 0);

    return {
      orders: list,
      totalRevenue,
      totalUnitsSold,
    };
  }
}
