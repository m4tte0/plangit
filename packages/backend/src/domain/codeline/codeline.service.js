import * as repository from './codeline.repository.js';
import { NotFoundError, ValidationError } from '../../errors.js';

function validate(data, { partial = false } = {}) {
  if (!partial && !data.name) {
    throw new ValidationError('name is required');
  }
}

export function list() {
  return repository.listCodelines();
}

export async function get(id) {
  const row = await repository.getCodeline(id);
  if (!row) throw new NotFoundError('Codeline', id);
  return row;
}

export function create(data) {
  validate(data);
  return repository.createCodeline({
    name: data.name,
    parent_codeline_id: data.parent_codeline_id ?? null,
    branch_point_date: data.branch_point_date ?? null,
    color: data.color ?? null,
  });
}

export async function update(id, data) {
  await get(id);
  validate(data, { partial: true });
  const patch = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.parent_codeline_id !== undefined) patch.parent_codeline_id = data.parent_codeline_id;
  if (data.branch_point_date !== undefined) patch.branch_point_date = data.branch_point_date;
  if (data.color !== undefined) patch.color = data.color;
  return repository.updateCodeline(id, patch);
}

export async function remove(id) {
  await get(id);
  await repository.deleteCodeline(id);
}
