import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';

const app = createApp();

describe('team members API', () => {
  it('creates and fetches a team member', async () => {
    const created = await request(app)
      .post('/api/team-members')
      .send({ name: 'Ada Lovelace', color: '#ff0000' })
      .expect(201);

    expect(created.body).toMatchObject({ name: 'Ada Lovelace', color: '#ff0000' });
    expect(created.body.id).toBeDefined();

    const fetched = await request(app).get(`/api/team-members/${created.body.id}`).expect(200);
    expect(fetched.body.name).toBe('Ada Lovelace');
  });

  it('rejects creation without a name', async () => {
    await request(app).post('/api/team-members').send({}).expect(400);
  });

  it('lists, updates, and deletes a team member', async () => {
    const created = await request(app)
      .post('/api/team-members')
      .send({ name: 'Grace Hopper' })
      .expect(201);

    const list = await request(app).get('/api/team-members').expect(200);
    expect(list.body).toHaveLength(1);

    const updated = await request(app)
      .patch(`/api/team-members/${created.body.id}`)
      .send({ color: '#00ff00' })
      .expect(200);
    expect(updated.body.color).toBe('#00ff00');

    await request(app).delete(`/api/team-members/${created.body.id}`).expect(204);
    await request(app).get(`/api/team-members/${created.body.id}`).expect(404);
  });
});
