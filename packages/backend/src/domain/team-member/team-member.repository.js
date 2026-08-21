import { db } from '../../db/connection.js';

const TABLE = 'team_members';

export function listTeamMembers() {
  return db(TABLE).select().orderBy('name');
}

export function getTeamMember(id) {
  return db(TABLE).where({ id }).first();
}

async function insertReturning(data) {
  const [row] = await db(TABLE).insert(data).returning('*');
  return row;
}

export function createTeamMember(data) {
  return insertReturning(data);
}

export async function updateTeamMember(id, patch) {
  const [row] = await db(TABLE).where({ id }).update(patch).returning('*');
  return row;
}

export function deleteTeamMember(id) {
  return db(TABLE).where({ id }).del();
}
