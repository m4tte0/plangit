import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

async function createCodeline(name = 'trunk') {
  const res = await request(app).post('/api/codelines').send({ name }).expect(201);
  return res.body;
}

describe('planned commits API', () => {
  it('creates a planned commit on a codeline with default status', async () => {
    const codeline = await createCodeline();

    const created = await request(app)
      .post('/api/planned-commits')
      .send({
        codeline_id: codeline.id,
        title: 'Land feature flag work',
        planned_date: '2026-08-15',
      })
      .expect(201);

    expect(created.body).toMatchObject({
      codeline_id: codeline.id,
      title: 'Land feature flag work',
      status: 'planned',
    });
    expect(created.body.assignee_ids).toEqual([]);
  });

  it('accepts assignee_ids and an explicit status', async () => {
    const codeline = await createCodeline();
    const member = await request(app)
      .post('/api/team-members')
      .send({ name: 'Ada Lovelace' })
      .expect(201);

    const created = await request(app)
      .post('/api/planned-commits')
      .send({
        codeline_id: codeline.id,
        title: 'Ship it',
        planned_date: '2026-08-20',
        status: 'in_progress',
        assignee_ids: [member.body.id],
      })
      .expect(201);

    expect(created.body.status).toBe('in_progress');
    expect(created.body.assignee_ids).toEqual([member.body.id]);
  });

  it('rejects an invalid status', async () => {
    const codeline = await createCodeline();
    await request(app)
      .post('/api/planned-commits')
      .send({
        codeline_id: codeline.id,
        title: 'Bad status',
        planned_date: '2026-08-20',
        status: 'not-a-status',
      })
      .expect(400);
  });

  it('rejects creation without a codeline_id', async () => {
    await request(app)
      .post('/api/planned-commits')
      .send({ title: 'No codeline', planned_date: '2026-08-20' })
      .expect(400);
  });
});
