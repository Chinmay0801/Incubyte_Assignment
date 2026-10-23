import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import type { AuthService } from '../services/authService';
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
export function createVehicleRouter(vehicles: VehicleService, auth: AuthService): Router {
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
    res.json(vehicles.purchase(id, quantity));
  });

  router.post('/:id/restock', adminOnly, (req, res) => {
    const id = parseId(req.params);
    const { quantity } = validateBody(restockSchema, req);
    res.json(vehicles.restock(id, quantity));
  });

  return router;
}
