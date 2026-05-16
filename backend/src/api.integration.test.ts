import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from './createApp';

describe('API — integración ligera', () => {
  const app = createApp();

  it('GET /health responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toContain('ASCENDX');
  });

  it('POST /auth/login sin body devuelve 400', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('ruta protegida sin token devuelve 401', async () => {
    const res = await request(app).get('/user/me');
    expect(res.status).toBe(401);
  });
});
