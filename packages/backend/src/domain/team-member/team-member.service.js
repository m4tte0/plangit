import * as repository from './team-member.repository.js';
import { NotFoundError, ValidationError } from '../../errors.js';

function validate(data, { partial = false } = {}) {
  if (!partial && !data.name) {
    throw new ValidationError('name is required');
  }
}

export function list() {
  return repository.listTeamMembers();
}

export async function get(id) {
  const row = await repository.getTeamMember(id);
  if (!row) throw new NotFoundError('TeamMember', id);
  return row;
}

export function create(data) {
  validate(data);
  return repository.createTeamMember({
    name: data.name,
    color: data.color ?? null,
  });
}

export async function update(id, data) {
  await get(id);
  validate(data, { partial: true });
  const patch = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.color !== undefined) patch.color = data.color;
  return repository.updateTeamMember(id, patch);
}

export async function remove(id) {
  await get(id);
  await repository.deleteTeamMember(id);
}
