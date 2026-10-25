import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import type { AuthService } from '../services/authService';
import type { OrderService } from '../services/orderService';

export function createOrderRouter(orders: OrderService, auth: AuthService): Router {
  const router = Router();
  const adminOnly = requireRole('admin');

  router.use(authenticate(auth));

  /** Returns purchase history for the logged-in customer. */
  router.get('/my', (req, res) => {
    res.json(orders.listUserOrders(req.user!.id));
  });

  /** Returns all dealership orders with sales metrics (Admin only). */
  router.get('/', adminOnly, (_req, res) => {
    res.json(orders.listAllOrders());
  });

  return router;
}
