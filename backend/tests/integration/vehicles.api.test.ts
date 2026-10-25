import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestContext, sampleVehicle, type TestContext } from './helpers';

describe('Vehicles API', () => {
  let ctx: TestContext;
  let userToken: string;
  let adminToken: string;

  const asUser = () => ({ Authorization: `Bearer ${userToken}` });
  const asAdmin = () => ({ Authorization: `Bearer ${adminToken}` });

  const createVehicle = async (body: object = sampleVehicle) => {
    const res = await request(ctx.app).post('/api/vehicles').set(asAdmin()).send(body);
    return res.body as { id: number };
  };

  beforeEach(async () => {
    ctx = createTestContext();
    userToken = await ctx.userToken();
    adminToken = await ctx.adminToken();
  });

  afterEach(() => ctx.db.close());

  describe('authentication', () => {
    it.each([
      ['post', '/api/vehicles'],
      ['get', '/api/vehicles'],
      ['get', '/api/vehicles/search'],
      ['get', '/api/vehicles/1'],
      ['put', '/api/vehicles/1'],
      ['delete', '/api/vehicles/1'],
      ['post', '/api/vehicles/1/purchase'],
      ['post', '/api/vehicles/1/restock'],
    ] as const)('%s %s returns 401 without a token', async (method, url) => {
      const res = await request(ctx.app)[method](url);

      expect(res.status).toBe(401);
    });

    it('returns 401 for a malformed Authorization header', async () => {
      const res = await request(ctx.app).get('/api/vehicles').set('Authorization', `Token ${userToken}`);

      expect(res.status).toBe(401);
    });

    it('returns 401 for an invalid token', async () => {
      const res = await request(ctx.app).get('/api/vehicles').set('Authorization', 'Bearer abc.def.ghi');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/vehicles', () => {
    it('adds a vehicle and returns 201 with its generated id', async () => {
      const res = await request(ctx.app).post('/api/vehicles').set(asUser()).send(sampleVehicle);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ id: expect.any(Number), ...sampleVehicle });
    });

    it('defaults quantity to 0 when omitted', async () => {
      const { quantity: _q, ...withoutQuantity } = sampleVehicle;
      const res = await request(ctx.app).post('/api/vehicles').set(asUser()).send(withoutQuantity);

      expect(res.status).toBe(201);
      expect(res.body.quantity).toBe(0);
    });

    it.each([
      ['missing make', { ...sampleVehicle, make: undefined }, 'make'],
      ['blank model', { ...sampleVehicle, model: '  ' }, 'model'],
      ['missing category', { ...sampleVehicle, category: undefined }, 'category'],
      ['zero price', { ...sampleVehicle, price: 0 }, 'price'],
      ['negative price', { ...sampleVehicle, price: -5 }, 'price'],
      ['price as string', { ...sampleVehicle, price: '100' }, 'price'],
      ['negative quantity', { ...sampleVehicle, quantity: -1 }, 'quantity'],
      ['fractional quantity', { ...sampleVehicle, quantity: 1.5 }, 'quantity'],
    ])('returns 400 for %s', async (_label, body, field) => {
      const res = await request(ctx.app).post('/api/vehicles').set(asUser()).send(body);

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ field })]));
    });
  });

  describe('GET /api/vehicles', () => {
    it('returns an empty list when there are no vehicles', async () => {
      const res = await request(ctx.app).get('/api/vehicles').set(asUser());

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns all vehicles, including ones that are out of stock', async () => {
      await createVehicle();
      await createVehicle({ ...sampleVehicle, model: 'Supra', quantity: 0 });

      const res = await request(ctx.app).get('/api/vehicles').set(asUser());

      expect(res.status).toBe(200);
      expect(res.body.map((v: { model: string }) => v.model)).toEqual(['Corolla', 'Supra']);
    });
  });

  describe('GET /api/vehicles/:id', () => {
    it('returns a single vehicle', async () => {
      const { id } = await createVehicle();

      const res = await request(ctx.app).get(`/api/vehicles/${id}`).set(asUser());

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id, ...sampleVehicle });
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(ctx.app).get('/api/vehicles/999').set(asUser());

      expect(res.status).toBe(404);
    });

    it.each(['abc', '0', '-1', '1.5'])('returns 400 for invalid id "%s"', async (id) => {
      const res = await request(ctx.app).get(`/api/vehicles/${id}`).set(asUser());

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/vehicles/export/csv (admin only)', () => {
    it('returns 403 for a regular user', async () => {
      const res = await request(ctx.app).get('/api/vehicles/export/csv').set(asUser());

      expect(res.status).toBe(403);
    });

    it('downloads the inventory as CSV, quoting text fields', async () => {
      await createVehicle({ make: 'Tata "Motors"', model: 'Nexon', category: 'SUV', price: 800000, quantity: 0 });

      const res = await request(ctx.app).get('/api/vehicles/export/csv').set(asAdmin());

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.headers['content-disposition']).toContain('dealership_inventory.csv');
      expect(res.text.split('\r\n')).toEqual([
        'Stock ID,Make,Model,Category,Price (INR),Stock,Status',
        expect.stringMatching(/^\d+,"Tata ""Motors""","Nexon","SUV",800000,0,Sold Out$/),
      ]);
    });
  });

  describe('GET /api/vehicles/search', () => {
    beforeEach(async () => {
      await createVehicle({ make: 'Toyota', model: 'Corolla', category: 'Sedan', price: 21000, quantity: 4 });
      await createVehicle({ make: 'Toyota', model: 'RAV4', category: 'SUV', price: 31000, quantity: 2 });
      await createVehicle({ make: 'Ford', model: 'F-150', category: 'Truck', price: 45000, quantity: 1 });
    });

    const search = (query: Record<string, string>) =>
      request(ctx.app).get('/api/vehicles/search').query(query).set(asUser());

    const models = (body: { model: string }[]) => body.map((v) => v.model);

    it.each([
      ['price_asc', ['Corolla', 'RAV4', 'F-150']],
      ['price_desc', ['F-150', 'RAV4', 'Corolla']],
      ['make_asc', ['F-150', 'Corolla', 'RAV4']],
      ['newest', ['F-150', 'RAV4', 'Corolla']],
    ])('sorts by %s', async (sortBy, expected) => {
      const res = await search({ sortBy });

      expect(models(res.body)).toEqual(expected);
    });

    it('returns 400 for an unknown sort order', async () => {
      const res = await search({ sortBy: 'colour' });

      expect(res.status).toBe(400);
    });

    it('searches by make', async () => {
      const res = await search({ make: 'toyota' });

      expect(res.status).toBe(200);
      expect(models(res.body)).toEqual(['Corolla', 'RAV4']);
    });

    it('searches by model (partial match)', async () => {
      expect(models((await search({ model: 'rav' })).body)).toEqual(['RAV4']);
    });

    it('searches by category', async () => {
      expect(models((await search({ category: 'truck' })).body)).toEqual(['F-150']);
    });

    it('searches by price range', async () => {
      expect(models((await search({ minPrice: '25000', maxPrice: '45000' })).body)).toEqual(['RAV4', 'F-150']);
    });

    it('combines filters', async () => {
      expect(models((await search({ make: 'toyota', maxPrice: '25000' })).body)).toEqual(['Corolla']);
    });

    it('ignores empty filter values', async () => {
      expect((await search({ make: '', category: '' })).body).toHaveLength(3);
    });

    it('returns an empty list when nothing matches', async () => {
      const res = await search({ make: 'Ferrari' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it.each([
      [{ minPrice: 'cheap' }],
      [{ maxPrice: '-1' }],
      [{ minPrice: '50000', maxPrice: '1000' }],
    ])('returns 400 for invalid price filters %o', async (query) => {
      expect((await search(query)).status).toBe(400);
    });

    it('returns 400 when a filter is repeated', async () => {
      const res = await request(ctx.app).get('/api/vehicles/search?make=a&make=b').set(asUser());

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/vehicles/:id', () => {
    it('updates the vehicle details', async () => {
      const { id } = await createVehicle();

      const res = await request(ctx.app).put(`/api/vehicles/${id}`).set(asUser()).send({ price: 19999.99, model: 'Corolla Cross' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id, price: 19999.99, model: 'Corolla Cross', make: 'Toyota' });
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(ctx.app).put('/api/vehicles/999').set(asUser()).send({ price: 1000 });

      expect(res.status).toBe(404);
    });

    it('returns 400 for an empty update', async () => {
      const { id } = await createVehicle();

      const res = await request(ctx.app).put(`/api/vehicles/${id}`).set(asUser()).send({});

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid values', async () => {
      const { id } = await createVehicle();

      const res = await request(ctx.app).put(`/api/vehicles/${id}`).set(asUser()).send({ price: -10 });

      expect(res.status).toBe(400);
    });

    it('rejects unknown fields', async () => {
      const { id } = await createVehicle();

      const res = await request(ctx.app).put(`/api/vehicles/${id}`).set(asUser()).send({ price: 1000, colour: 'red' });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual([{ field: 'colour', message: 'Unknown field "colour"' }]);
    });

    it('trims text fields', async () => {
      const { id } = await createVehicle();

      const res = await request(ctx.app).put(`/api/vehicles/${id}`).set(asUser()).send({ make: '  Lexus  ' });

      expect(res.body.make).toBe('Lexus');
    });

    it('does not allow stock to be changed outside of purchase / restock', async () => {
      const { id } = await createVehicle();

      const res = await request(ctx.app).put(`/api/vehicles/${id}`).set(asUser()).send({ quantity: 999 });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'quantity' })]));
    });
  });

  describe('DELETE /api/vehicles/:id (admin only)', () => {
    it('returns 403 for a regular user and keeps the vehicle', async () => {
      const { id } = await createVehicle();

      const res = await request(ctx.app).delete(`/api/vehicles/${id}`).set(asUser());

      expect(res.status).toBe(403);
      expect((await request(ctx.app).get(`/api/vehicles/${id}`).set(asUser())).status).toBe(200);
    });

    it('lets an admin delete a vehicle (204)', async () => {
      const { id } = await createVehicle();

      const res = await request(ctx.app).delete(`/api/vehicles/${id}`).set(asAdmin());

      expect(res.status).toBe(204);
      expect((await request(ctx.app).get(`/api/vehicles/${id}`).set(asAdmin())).status).toBe(404);
    });

    it('returns 404 when the vehicle does not exist', async () => {
      const res = await request(ctx.app).delete('/api/vehicles/999').set(asAdmin());

      expect(res.status).toBe(404);
    });
  });
});
