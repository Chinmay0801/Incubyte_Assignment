import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestContext, sampleVehicle, type TestContext } from './helpers';

describe('Orders and Reporting API', () => {
  let ctx: TestContext;
  let userToken: string;
  let adminToken: string;
  let vehicleId: number;

  const asUser = () => ({ Authorization: `Bearer ${userToken}` });
  const asAdmin = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeEach(async () => {
    ctx = createTestContext();
    userToken = await ctx.userToken();
    adminToken = await ctx.adminToken();

    const res = await request(ctx.app)
      .post('/api/vehicles')
      .set(asAdmin())
      .send({ ...sampleVehicle, price: 15000, quantity: 5 });
    vehicleId = res.body.id;
  });

  afterEach(() => ctx.db.close());

  describe('GET /api/orders/my', () => {
    it('returns 401 without authentication', async () => {
      const res = await request(ctx.app).get('/api/orders/my');
      expect(res.status).toBe(401);
    });

    it('returns an empty list when the customer has not bought any vehicles', async () => {
      const res = await request(ctx.app).get('/api/orders/my').set(asUser());
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('records and returns orders after a vehicle purchase', async () => {
      // Customer purchases 2 units
      const buyRes = await request(ctx.app)
        .post(`/api/vehicles/${vehicleId}/purchase`)
        .set(asUser())
        .send({ quantity: 2 });
      expect(buyRes.status).toBe(200);

      const res = await request(ctx.app).get('/api/orders/my').set(asUser());
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        vehicleId,
        quantity: 2,
        unitPrice: 15000,
        totalPrice: 30000,
        make: 'Toyota',
        model: 'Corolla',
      });
    });
  });

  describe('GET /api/orders (admin only)', () => {
    it('returns 403 for regular users', async () => {
      const res = await request(ctx.app).get('/api/orders').set(asUser());
      expect(res.status).toBe(403);
    });

    it('returns sales summary and total revenue for admins', async () => {
      await request(ctx.app)
        .post(`/api/vehicles/${vehicleId}/purchase`)
        .set(asUser())
        .send({ quantity: 2 });

      const res = await request(ctx.app).get('/api/orders').set(asAdmin());
      expect(res.status).toBe(200);
      expect(res.body.totalUnitsSold).toBe(2);
      expect(res.body.totalRevenue).toBe(30000);
      expect(res.body.orders).toHaveLength(1);
      expect(res.body.orders[0]).toMatchObject({
        userName: 'Regular User',
        userEmail: 'user@example.com',
        quantity: 2,
      });
    });
  });

  describe('GET /api/vehicles/export/csv', () => {
    it('returns 403 for non-admins', async () => {
      const res = await request(ctx.app).get('/api/vehicles/export/csv').set(asUser());
      expect(res.status).toBe(403);
    });

    it('returns formatted CSV inventory for admins', async () => {
      const res = await request(ctx.app).get('/api/vehicles/export/csv').set(asAdmin());
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('attachment; filename="dealership_inventory.csv"');
      expect(res.text).toContain('Stock ID,Make,Model,Category,Price (INR),Stock,Status');
      expect(res.text).toContain('"Toyota","Corolla"');
    });
  });

  describe('GET /api/docs', () => {
    it('serves interactive swagger HTML', async () => {
      const res = await request(ctx.app).get('/api/docs');
      expect(res.status).toBe(200);
      expect(res.text).toContain('SwaggerUIBundle');
    });

    it('serves openapi spec JSON', async () => {
      const res = await request(ctx.app).get('/api/docs/spec.json');
      expect(res.status).toBe(200);
      expect(res.body.openapi).toBe('3.0.3');
      expect(res.body.info.title).toContain('Lotline');
    });
  });
});
