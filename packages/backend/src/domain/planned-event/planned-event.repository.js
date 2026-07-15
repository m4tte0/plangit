import { db } from '../../db/connection.js';

const TABLE = 'planned_events';

export function listPlannedEvents() {
  return db(TABLE).select().orderBy('planned_date');
}

export function getPlannedEvent(id) {
  return db(TABLE).where({ id }).first();
}

export async function createPlannedEvent(data) {
  const [row] = await db(TABLE).insert(data).returning('*');
  return row;
}

export async function updatePlannedEvent(id, patch) {
  const [row] = await db(TABLE).where({ id }).update(patch).returning('*');
  return row;
}

export function deletePlannedEvent(id) {
  return db(TABLE).where({ id }).del();
}
