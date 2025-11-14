import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../app';

describe('Swagger docs routes', () => {
  it('returns HTML for the Swagger UI', async () => {
    const res = await request(app).get('/docs/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('<title>Swagger UI</title>');
  });

  it('returns the OpenAPI YAML file', async () => {
    const res = await request(app).get('/docs/openapi.yaml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('yaml');
    expect(res.text).toContain('openapi:');
  });
});
