import * as repository from './planned-event.repository.js';
import { NotFoundError, ValidationError } from '../../errors.js';

export const TYPES = ['BRANCH_CREATE', 'MERGE', 'RELEASE_TAG'];
export const STATUSES = ['planned', 'in_progress', 'done', 'slipped'];

// BRANCH_CREATE and MERGE act on two codelines; RELEASE_TAG only tags one.
const TYPES_REQUIRING_TARGET = ['BRANCH_CREATE', 'MERGE'];

function validate(data, { partial = false } = {}) {
  if (!partial) {
    if (!data.type) throw new ValidationError('type is required');
    if (!data.source_codeline_id) throw new ValidationError('source_codeline_id is required');
    if (!data.planned_date) throw new ValidationError('planned_date is required');
  }
  if (data.type !== undefined && !TYPES.includes(data.type)) {
    throw new ValidationError(`type must be one of ${TYPES.join(', ')}`);
  }
  if (
    data.type !== undefined &&
    TYPES_REQUIRING_TARGET.includes(data.type) &&
    data.target_codeline_id === undefined
  ) {
    throw new ValidationError(`target_codeline_id is required for ${data.type}`);
  }
  if (data.status !== undefined && !STATUSES.includes(data.status)) {
    throw new ValidationError(`status must be one of ${STATUSES.join(', ')}`);
  }
}

export function list() {
  return repository.listPlannedEvents();
}

export async function get(id) {
  const row = await repository.getPlannedEvent(id);
  if (!row) throw new NotFoundError('PlannedEvent', id);
  return row;
}

export function create(data) {
  validate(data);
  return repository.createPlannedEvent({
    type: data.type,
    source_codeline_id: data.source_codeline_id,
    target_codeline_id: data.target_codeline_id ?? null,
    planned_date: data.planned_date,
    status: data.status ?? 'planned',
    milestone_id: data.milestone_id ?? null,
  });
}

export async function update(id, data) {
  await get(id);
  validate(data, { partial: true });
  const patch = {};
  if (data.type !== undefined) patch.type = data.type;
  if (data.source_codeline_id !== undefined) patch.source_codeline_id = data.source_codeline_id;
  if (data.target_codeline_id !== undefined) patch.target_codeline_id = data.target_codeline_id;
  if (data.planned_date !== undefined) patch.planned_date = data.planned_date;
  if (data.status !== undefined) patch.status = data.status;
  if (data.milestone_id !== undefined) patch.milestone_id = data.milestone_id;
  return repository.updatePlannedEvent(id, patch);
}

export async function remove(id) {
  await get(id);
  await repository.deletePlannedEvent(id);
}
