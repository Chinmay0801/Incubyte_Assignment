import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import type { AuthService } from '../services/authService';
import type { OrderService } from '../services/orderService';
import type { VehicleService } from '../services/vehicleService';
import {
  createVehicleSchema,
  purchaseSchema,
  restockSchema,
  searchVehiclesSchema,
  updateVehicleSchema,
  vehicleParamsSchema,
} from '../validation/schemas';
import { validate, validateBody } from '../validation/validate';

/** Vehicle catalogue + inventory endpoints. Every route requires authentication. */
export function createVehicleRouter(vehicles: VehicleService, auth: AuthService, orders?: OrderService): Router {
  const router = Router();
  const adminOnly = requireRole('admin');
  const parseId = (params: unknown) => validate(vehicleParamsSchema, params).id;

  router.use(authenticate(auth));

  router.post('/', (req, res) => {
    const input = validateBody(createVehicleSchema, req);
    res.status(201).json(vehicles.create(input));
  });

  router.get('/', (_req, res) => {
    res.json(vehicles.list());
  });

  // Export CSV of lot inventory (Admin only). Placed before "/:id"
  router.get('/export/csv', adminOnly, (_req, res) => {
    const list = vehicles.list();
    const headers = ['Stock ID', 'Make', 'Model', 'Category', 'Price (INR)', 'Stock', 'Status'];
    const rows = list.map((v) => [
      v.id,
      `"${v.make.replace(/"/g, '""')}"`,
      `"${v.model.replace(/"/g, '""')}"`,
      `"${v.category.replace(/"/g, '""')}"`,
      v.price,
      v.quantity,
      v.quantity > 0 ? 'In Stock' : 'Sold Out',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="dealership_inventory.csv"');
    res.status(200).send(csvContent);
  });

  // Must be registered before "/:id" so "search" is not treated as an id.
  router.get('/search', (req, res) => {
    const filters = validate(searchVehiclesSchema, req.query);
    res.json(vehicles.search(filters));
  });

  router.get('/:id', (req, res) => {
    res.json(vehicles.getById(parseId(req.params)));
  });

  router.put('/:id', (req, res) => {
    const id = parseId(req.params);
    const changes = validateBody(updateVehicleSchema, req);
    res.json(vehicles.update(id, changes));
  });

  router.delete('/:id', adminOnly, (req, res) => {
    vehicles.delete(parseId(req.params));
    res.status(204).end();
  });

  router.post('/:id/purchase', (req, res) => {
    const id = parseId(req.params);
    const { quantity } = validateBody(purchaseSchema, req);
    const updated = vehicles.purchase(id, quantity);

    if (orders && req.user) {
      orders.recordPurchase({
        userId: req.user.id,
        vehicleId: id,
        quantity: quantity ?? 1,
        unitPrice: updated.price,
      });
    }

    res.json(updated);
  });

  router.post('/:id/restock', adminOnly, (req, res) => {
    const id = parseId(req.params);
    const { quantity } = validateBody(restockSchema, req);
    res.json(vehicles.restock(id, quantity));
  });

  return router;
}
