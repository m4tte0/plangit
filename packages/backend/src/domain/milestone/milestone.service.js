import * as repository from './milestone.repository.js';
import { NotFoundError, ValidationError } from '../../errors.js';

function validate(data, { partial = false } = {}) {
  if (!partial && !data.name) {
    throw new ValidationError('name is required');
  }
}

export function list() {
  return repository.listMilestones();
}

export async function get(id) {
  const row = await repository.getMilestone(id);
  if (!row) throw new NotFoundError('Milestone', id);
  return row;
}

export function create(data) {
  validate(data);
  return repository.createMilestone({
    name: data.name,
    target_date: data.target_date ?? null,
    description: data.description ?? null,
  });
}

export async function update(id, data) {
  await get(id);
  validate(data, { partial: true });
  const patch = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.target_date !== undefined) patch.target_date = data.target_date;
  if (data.description !== undefined) patch.description = data.description;
  return repository.updateMilestone(id, patch);
}

export async function remove(id) {
  await get(id);
  await repository.deleteMilestone(id);
}
