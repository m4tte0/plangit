import { db } from '../../db/connection.js';

const TABLE = 'planned_commits';

export function listPlannedCommits() {
  return db(TABLE).select().orderBy('planned_date');
}

export function getPlannedCommit(id) {
  return db(TABLE).where({ id }).first();
}

export async function createPlannedCommit(data) {
  const [row] = await db(TABLE).insert(data).returning('*');
  return row;
}

export async function updatePlannedCommit(id, patch) {
  const [row] = await db(TABLE).where({ id }).update(patch).returning('*');
  return row;
}

export function deletePlannedCommit(id) {
  return db(TABLE).where({ id }).del();
}
