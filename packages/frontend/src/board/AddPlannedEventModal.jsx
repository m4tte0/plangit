import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

const TYPE_OPTIONS = [
  { value: 'BRANCH_CREATE', label: 'Branch create' },
  { value: 'MERGE', label: 'Merge' },
  { value: 'RELEASE_TAG', label: 'Release tag' },
];

// Mirrors TYPES_REQUIRING_TARGET in planned-event.service.js.
const TYPES_REQUIRING_TARGET = ['BRANCH_CREATE', 'MERGE'];

export function AddPlannedEventModal({ codelines, onClose, onCreated }) {
  const [type, setType] = useState('BRANCH_CREATE');
  const [sourceCodelineId, setSourceCodelineId] = useState(codelines[0]?.id ?? '');
  const [targetCodelineId, setTargetCodelineId] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const needsTarget = TYPES_REQUIRING_TARGET.includes(type);

  useEffect(() => {
    api.listMilestones().then(setMilestones).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!sourceCodelineId) {
      setFormError('Source codeline is required');
      return;
    }
    if (needsTarget && !targetCodelineId) {
      setFormError('Target codeline is required for this event type');
      return;
    }
    if (!plannedDate) {
      setFormError('Planned date is required');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await api.createPlannedEvent({
        type,
        source_codeline_id: sourceCodelineId,
        target_codeline_id: needsTarget ? targetCodelineId : null,
        planned_date: plannedDate,
        milestone_id: milestoneId || null,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add planned event</h2>
        <form onSubmit={handleSubmit}>
          <label className="modal-field">
            Type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="modal-field">
            Source codeline
            <select value={sourceCodelineId} onChange={(e) => setSourceCodelineId(e.target.value)}>
              {codelines.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.name}
                </option>
              ))}
            </select>
          </label>

          {needsTarget && (
            <label className="modal-field">
              Target codeline
              <select value={targetCodelineId} onChange={(e) => setTargetCodelineId(e.target.value)}>
                <option value="">Select…</option>
                {codelines.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="modal-field">
            Planned date
            <input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
          </label>

          <label className="modal-field">
            Milestone (optional)
            <select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)}>
              <option value="">None</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>

          {formError && <p className="modal-error">{formError}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
