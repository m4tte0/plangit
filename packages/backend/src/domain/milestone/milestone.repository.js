import { db } from '../../db/connection.js';

const TABLE = 'milestones';

export function listMilestones() {
  return db(TABLE).select().orderBy('target_date');
}

export function getMilestone(id) {
  return db(TABLE).where({ id }).first();
}

export async function createMilestone(data) {
  const [row] = await db(TABLE).insert(data).returning('*');
  return row;
}

export async function updateMilestone(id, patch) {
  const [row] = await db(TABLE).where({ id }).update(patch).returning('*');
  return row;
}

export function deleteMilestone(id) {
  return db(TABLE).where({ id }).del();
}
