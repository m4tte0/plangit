import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export function AddPlannedCommitModal({ codelines, onClose, onCreated }) {
  const [codelineId, setCodelineId] = useState(codelines[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    api.listMilestones().then(setMilestones).catch(() => {});
    api.listTeamMembers().then(setTeamMembers).catch(() => {});
  }, []);

  function toggleAssignee(id) {
    setAssigneeIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!codelineId) {
      setFormError('Codeline is required');
      return;
    }
    if (!trimmedTitle) {
      setFormError('Title is required');
      return;
    }
    if (!plannedDate) {
      setFormError('Planned date is required');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await api.createPlannedCommit({
        codeline_id: codelineId,
        title: trimmedTitle,
        description: description.trim() || null,
        planned_date: plannedDate,
        milestone_id: milestoneId || null,
        assignee_ids: assigneeIds,
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
        <h2>Add planned commit</h2>
        <form onSubmit={handleSubmit}>
          <label className="modal-field">
            Codeline
            <select value={codelineId} onChange={(e) => setCodelineId(e.target.value)}>
              {codelines.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.name}
                </option>
              ))}
            </select>
          </label>

          <label className="modal-field">
            Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Land feature flag work"
              autoFocus
            />
          </label>

          <label className="modal-field">
            Description (optional)
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

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

          {teamMembers.length > 0 && (
            <fieldset className="modal-field modal-assignees">
              <legend>Assignees (optional)</legend>
              {teamMembers.map((member) => (
                <label key={member.id} className="modal-assignee-option">
                  <input
                    type="checkbox"
                    checked={assigneeIds.includes(member.id)}
                    onChange={() => toggleAssignee(member.id)}
                  />
                  {member.name}
                </label>
              ))}
            </fieldset>
          )}

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
