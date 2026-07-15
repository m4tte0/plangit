import { beforeAll, afterEach, afterAll } from 'vitest';
import { db } from '../src/db/connection.js';

beforeAll(async () => {
  await db.migrate.latest();
});

afterEach(async () => {
  await db.raw(
    'TRUNCATE TABLE planned_events, planned_commits, codelines, milestones, team_members RESTART IDENTITY CASCADE',
  );
});

afterAll(async () => {
  await db.destroy();
});
