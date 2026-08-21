import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('codelines API', () => {
  it('creates a trunk codeline and a branch off it', async () => {
    const trunk = await request(app)
      .post('/api/codelines')
      .send({ name: 'trunk', color: '#333333' })
      .expect(201);

    const branch = await request(app)
      .post('/api/codelines')
      .send({
        name: 'branches/release-2.4',
        parent_codeline_id: trunk.body.id,
        branch_point_date: '2026-08-01',
      })
      .expect(201);

    expect(branch.body.parent_codeline_id).toBe(trunk.body.id);
  });

  it('rejects a branch pointing at a nonexistent parent', async () => {
    await request(app)
      .post('/api/codelines')
      .send({ name: 'branches/orphan', parent_codeline_id: '00000000-0000-0000-0000-000000000000' })
      .expect(400);
  });

  it('rejects creation without a name', async () => {
    await request(app).post('/api/codelines').send({}).expect(400);
  });
});
