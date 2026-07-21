import { useState } from 'react';
import { api } from '../api/client.js';

export function AddCodelineModal({ codelines, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [branchPointDate, setBranchPointDate] = useState('');
  const [color, setColor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError('Name is required');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const created = await api.createCodeline({
        name: trimmedName,
        parent_codeline_id: parentId || null,
        branch_point_date: parentId && branchPointDate ? branchPointDate : null,
        color: color.trim() || null,
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
        <h2>Add codeline</h2>
        <form onSubmit={handleSubmit}>
          <label className="modal-field">
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="trunk"
              autoFocus
            />
          </label>

          <label className="modal-field">
            Parent codeline
            <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">None (trunk-level)</option>
              {codelines.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.name}
                </option>
              ))}
            </select>
          </label>

          {parentId && (
            <label className="modal-field">
              Branch point date
              <input
                type="date"
                value={branchPointDate}
                onChange={(e) => setBranchPointDate(e.target.value)}
              />
            </label>
          )}

          <label className="modal-field">
            Color (optional)
            <div className="modal-color-row">
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="auto (e.g. #2a78d6)"
              />
              <span className="modal-color-swatch" style={{ background: color.trim() || 'transparent' }} />
            </div>
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
