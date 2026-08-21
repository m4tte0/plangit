import * as repository from './planned-commit.repository.js';
import { NotFoundError, ValidationError } from '../../errors.js';

export const STATUSES = ['planned', 'in_progress', 'done', 'slipped'];

function validate(data, { partial = false } = {}) {
  if (!partial) {
    if (!data.codeline_id) throw new ValidationError('codeline_id is required');
    if (!data.title) throw new ValidationError('title is required');
    if (!data.planned_date) throw new ValidationError('planned_date is required');
  }
  if (data.status !== undefined && !STATUSES.includes(data.status)) {
    throw new ValidationError(`status must be one of ${STATUSES.join(', ')}`);
  }
  if (data.assignee_ids !== undefined && !Array.isArray(data.assignee_ids)) {
    throw new ValidationError('assignee_ids must be an array of team member ids');
  }
}

export function list() {
  return repository.listPlannedCommits();
}

export async function get(id) {
  const row = await repository.getPlannedCommit(id);
  if (!row) throw new NotFoundError('PlannedCommit', id);
  return row;
}

export function create(data) {
  validate(data);
  return repository.createPlannedCommit({
    codeline_id: data.codeline_id,
    title: data.title,
    description: data.description ?? null,
    planned_date: data.planned_date,
    status: data.status ?? 'planned',
    assignee_ids: data.assignee_ids ?? [],
    milestone_id: data.milestone_id ?? null,
  });
}

export async function update(id, data) {
  await get(id);
  validate(data, { partial: true });
  const patch = {};
  if (data.codeline_id !== undefined) patch.codeline_id = data.codeline_id;
  if (data.title !== undefined) patch.title = data.title;
  if (data.description !== undefined) patch.description = data.description;
  if (data.planned_date !== undefined) patch.planned_date = data.planned_date;
  if (data.status !== undefined) patch.status = data.status;
  if (data.assignee_ids !== undefined) patch.assignee_ids = data.assignee_ids;
  if (data.milestone_id !== undefined) patch.milestone_id = data.milestone_id;
  return repository.updatePlannedCommit(id, patch);
}

export async function remove(id) {
  await get(id);
  await repository.deletePlannedCommit(id);
}
