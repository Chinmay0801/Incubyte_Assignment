import { Router } from 'express';

export function createDocsRouter(): Router {
  const router = Router();

  const openApiSpec = {
    openapi: '3.0.3',
    info: {
      title: 'Lotline: Car Dealership Inventory System API',
      version: '1.0.0',
      description:
        'RESTful API for Car Dealership inventory management, customer purchases, atomic stock control, and admin operations.',
    },
    servers: [{ url: '/api', description: 'API Base Path' }],
    paths: {
      '/auth/register': {
        post: {
          summary: 'Register a new customer account',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string' } } } } },
          },
          responses: { 201: { description: 'Registration successful' } },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Sign in with email and password',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { properties: { email: { type: 'string' }, password: { type: 'string' } } } } },
          },
          responses: { 200: { description: 'JWT token returned' } },
        },
      },
      '/vehicles': {
        get: {
          summary: 'List all vehicles on the lot',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Array of vehicles' } },
        },
        post: {
          summary: 'Add a new vehicle',
          security: [{ BearerAuth: [] }],
          responses: { 201: { description: 'Vehicle created' }, 400: { description: 'Validation error' } },
        },
      },
      '/vehicles/{id}': {
        get: {
          summary: 'Get one vehicle',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Vehicle' }, 404: { description: 'Not found' } },
        },
        put: {
          summary: "Update a vehicle's details",
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Updated vehicle' }, 400: { description: 'Validation error' }, 404: { description: 'Not found' } },
        },
        delete: {
          summary: 'Delete a vehicle (Admin only)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 204: { description: 'Deleted' }, 403: { description: 'Admin only' }, 404: { description: 'Not found' } },
        },
      },
      '/vehicles/{id}/purchase': {
        post: {
          summary: 'Purchase a vehicle, decreasing its quantity',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Updated vehicle' }, 409: { description: 'Not enough stock' } },
        },
      },
      '/vehicles/{id}/restock': {
        post: {
          summary: 'Restock a vehicle, increasing its quantity (Admin only)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Updated vehicle' }, 403: { description: 'Admin only' } },
        },
      },
      '/vehicles/search': {
        get: {
          summary: 'Search and filter vehicles',
          parameters: [
            { name: 'make', in: 'query', schema: { type: 'string' } },
            { name: 'model', in: 'query', schema: { type: 'string' } },
            { name: 'category', in: 'query', schema: { type: 'string' } },
            { name: 'minPrice', in: 'query', schema: { type: 'number' } },
            { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
            { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['price_asc', 'price_desc', 'make_asc', 'newest'] } },
          ],
          responses: { 200: { description: 'Matching vehicles' } },
        },
      },
      '/vehicles/export/csv': {
        get: {
          summary: 'Export inventory as CSV (Admin only)',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'CSV file download' } },
        },
      },
      '/orders/my': {
        get: {
          summary: 'Get purchase history for logged-in customer',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Customer orders' } },
        },
      },
      '/orders': {
        get: {
          summary: 'Get all dealership sales & revenue report (Admin only)',
          security: [{ BearerAuth: [] }],
          responses: { 200: { description: 'Sales and orders summary' } },
        },
      },
    },
  };

  router.get('/spec.json', (_req, res) => {
    res.json(openApiSpec);
  });

  router.get('/', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Lotline Dealership API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <style>
    body { margin: 0; background: #16191c; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .topbar { display: none; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: '/api/docs/spec.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis],
      layout: "BaseLayout"
    });
  </script>
</body>
</html>`);
  });

  return router;
}
