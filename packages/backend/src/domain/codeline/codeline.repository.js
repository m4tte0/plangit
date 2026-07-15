import { db } from '../../db/connection.js';

const TABLE = 'codelines';

export function listCodelines() {
  return db(TABLE).select().orderBy('name');
}

export function getCodeline(id) {
  return db(TABLE).where({ id }).first();
}

export async function createCodeline(data) {
  const [row] = await db(TABLE).insert(data).returning('*');
  return row;
}

export async function updateCodeline(id, patch) {
  const [row] = await db(TABLE).where({ id }).update(patch).returning('*');
  return row;
}

export function deleteCodeline(id) {
  return db(TABLE).where({ id }).del();
}
