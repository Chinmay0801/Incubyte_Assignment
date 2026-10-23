import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestContext, sampleVehicle, type TestContext } from './helpers';

describe('Inventory API', () => {
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
      .send({ ...sampleVehicle, quantity: 2 });
    vehicleId = res.body.id;
  });

  afterEach(() => ctx.db.close());

  describe('POST /api/vehicles/:id/purchase', () => {
    it('decreases the quantity by one when no body is sent', async () => {
      const res = await request(ctx.app).post(`/api/vehicles/${vehicleId}/purchase`).set(asUser());

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: vehicleId, quantity: 1 });
    });

    it('decreases the quantity by the requested amount', async () => {
      const res = await request(ctx.app)
        .post(`/api/vehicles/${vehicleId}/purchase`)
        .set(asUser())
        .send({ quantity: 2 });

      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(0);
    });

    it('returns 409 when the vehicle is out of stock', async () => {
      await request(ctx.app).post(`/api/vehicles/${vehicleId}/purchase`).set(asUser()).send({ quantity: 2 });

      const res = await request(ctx.app).post(`/api/vehicles/${vehicleId}/purchase`).set(asUser());

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/out of stock/i);
    });

    it('returns 409 when asking for more than is in stock, without changing stock', async () => {
      const res = await request(ctx.app)
        .post(`/api/vehicles/${vehicleId}/purchase`)
        .set(asUser())
        .send({ quantity: 3 });

      expect(res.status).toBe(409);
      const after = await request(ctx.app).get(`/api/vehicles/${vehicleId}`).set(asUser());
      expect(after.body.quantity).toBe(2);
    });

    it('never oversells under concurrent purchases', async () => {
      const attempts = await Promise.all(
        Array.from({ length: 5 }, () => request(ctx.app).post(`/api/vehicles/${vehicleId}/purchase`).set(asUser())),
      );

      expect(attempts.filter((r) => r.status === 200)).toHaveLength(2);
      expect(attempts.filter((r) => r.status === 409)).toHaveLength(3);
      const after = await request(ctx.app).get(`/api/vehicles/${vehicleId}`).set(asUser());
      expect(after.body.quantity).toBe(0);
    });

    it.each([{ quantity: 0 }, { quantity: -1 }, { quantity: 1.5 }, { quantity: 'two' }])(
      'returns 400 for invalid body %o',
      async (body) => {
        const res = await request(ctx.app).post(`/api/vehicles/${vehicleId}/purchase`).set(asUser()).send(body);

        expect(res.status).toBe(400);
      },
    );

    it('returns 404 for an unknown vehicle', async () => {
      const res = await request(ctx.app).post('/api/vehicles/999/purchase').set(asUser());

      expect(res.status).toBe(404);
    });

    it('is also allowed for admins', async () => {
      const res = await request(ctx.app).post(`/api/vehicles/${vehicleId}/purchase`).set(asAdmin());

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/vehicles/:id/restock (admin only)', () => {
    it('returns 403 for a regular user and leaves stock unchanged', async () => {
      const res = await request(ctx.app)
        .post(`/api/vehicles/${vehicleId}/restock`)
        .set(asUser())
        .send({ quantity: 5 });

      expect(res.status).toBe(403);
      const after = await request(ctx.app).get(`/api/vehicles/${vehicleId}`).set(asUser());
      expect(after.body.quantity).toBe(2);
    });

    it('increases the quantity for an admin', async () => {
      const res = await request(ctx.app)
        .post(`/api/vehicles/${vehicleId}/restock`)
        .set(asAdmin())
        .send({ quantity: 5 });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: vehicleId, quantity: 7 });
    });

    it('makes an out-of-stock vehicle purchasable again', async () => {
      await request(ctx.app).post(`/api/vehicles/${vehicleId}/purchase`).set(asUser()).send({ quantity: 2 });
      await request(ctx.app).post(`/api/vehicles/${vehicleId}/restock`).set(asAdmin()).send({ quantity: 1 });

      const res = await request(ctx.app).post(`/api/vehicles/${vehicleId}/purchase`).set(asUser());

      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(0);
    });

    it.each([{}, { quantity: 0 }, { quantity: -3 }, { quantity: 2.5 }, { quantity: '5' }])(
      'returns 400 for invalid body %o',
      async (body) => {
        const res = await request(ctx.app).post(`/api/vehicles/${vehicleId}/restock`).set(asAdmin()).send(body);

        expect(res.status).toBe(400);
      },
    );

    it('returns 404 for an unknown vehicle', async () => {
      const res = await request(ctx.app).post('/api/vehicles/999/restock').set(asAdmin()).send({ quantity: 1 });

      expect(res.status).toBe(404);
    });
  });
});
