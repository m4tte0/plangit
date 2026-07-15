import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('milestones API', () => {
  it('creates, updates, and deletes a milestone', async () => {
    const created = await request(app)
      .post('/api/milestones')
      .send({ name: 'v2.4 release', target_date: '2026-09-01' })
      .expect(201);

    expect(created.body.name).toBe('v2.4 release');

    const updated = await request(app)
      .patch(`/api/milestones/${created.body.id}`)
      .send({ description: 'Q3 release' })
      .expect(200);
    expect(updated.body.description).toBe('Q3 release');

    await request(app).delete(`/api/milestones/${created.body.id}`).expect(204);
    await request(app).get(`/api/milestones/${created.body.id}`).expect(404);
  });

  it('rejects creation without a name', async () => {
    await request(app).post('/api/milestones').send({}).expect(400);
  });
});
