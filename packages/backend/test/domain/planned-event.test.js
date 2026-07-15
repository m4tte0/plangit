import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

async function createCodeline(name) {
  const res = await request(app).post('/api/codelines').send({ name }).expect(201);
  return res.body;
}

describe('planned events API', () => {
  it('creates a BRANCH_CREATE event between two codelines', async () => {
    const trunk = await createCodeline('trunk');
    const branch = await createCodeline('branches/release-2.4');

    const created = await request(app)
      .post('/api/planned-events')
      .send({
        type: 'BRANCH_CREATE',
        source_codeline_id: trunk.id,
        target_codeline_id: branch.id,
        planned_date: '2026-08-01',
      })
      .expect(201);

    expect(created.body).toMatchObject({
      type: 'BRANCH_CREATE',
      source_codeline_id: trunk.id,
      target_codeline_id: branch.id,
      status: 'planned',
    });
  });

  it('creates a RELEASE_TAG event without a target codeline', async () => {
    const trunk = await createCodeline('trunk');

    const created = await request(app)
      .post('/api/planned-events')
      .send({
        type: 'RELEASE_TAG',
        source_codeline_id: trunk.id,
        planned_date: '2026-09-01',
      })
      .expect(201);

    expect(created.body.target_codeline_id).toBeNull();
  });

  it('rejects MERGE without a target codeline', async () => {
    const trunk = await createCodeline('trunk');

    await request(app)
      .post('/api/planned-events')
      .send({
        type: 'MERGE',
        source_codeline_id: trunk.id,
        planned_date: '2026-09-01',
      })
      .expect(400);
  });

  it('rejects an invalid type', async () => {
    const trunk = await createCodeline('trunk');

    await request(app)
      .post('/api/planned-events')
      .send({
        type: 'DELETE_EVERYTHING',
        source_codeline_id: trunk.id,
        planned_date: '2026-09-01',
      })
      .expect(400);
  });
});
