import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { STATUS_COLOR } from './colors.js';
import { buildGitGraphScripts } from './gitGraphScript.js';
import { GitGraphDiagram } from './GitGraphDiagram.jsx';
import { AddCodelineModal } from './AddCodelineModal.jsx';
import { AddPlannedCommitModal } from './AddPlannedCommitModal.jsx';
import { AddPlannedEventModal } from './AddPlannedEventModal.jsx';
import './board.css';

function useColorScheme() {
  const [isDark, setIsDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches,
  );
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setIsDark(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isDark ? 'dark' : 'default';
}

function BoardLegend() {
  const neutral = 'var(--text-secondary)';
  return (
    <div className="board-legend">
      <span className="board-legend-item">
        <svg width={16} height={16} viewBox="-8 -8 16 16">
          <circle r={7} fill={neutral} />
        </svg>
        Commit
      </span>
      <span className="board-legend-item">
        <svg width={16} height={16} viewBox="-8 -8 16 16">
          <circle r={7} fill={neutral} />
          <path d="M -3.5 -3.5 L 3.5 3.5 M -3.5 3.5 L 3.5 -3.5" stroke="var(--surface)" strokeWidth={1.5} strokeLinecap="round" />
        </svg>
        Slipped
      </span>
      <span className="board-legend-item">
        <svg width={16} height={16} viewBox="-8 -8 16 16">
          <rect x={-7} y={-7} width={14} height={14} fill={neutral} />
          <rect x={-4} y={-4} width={8} height={8} fill="var(--surface)" />
        </svg>
        Milestone commit
      </span>
      <span className="board-legend-item">
        <svg width={16} height={16} viewBox="-8 -8 16 16">
          <circle r={7} fill={neutral} />
          <circle r={4} fill="var(--surface)" />
        </svg>
        Merge
      </span>
      <span className="board-legend-item">
        <svg width={22} height={16} viewBox="-2 -9 22 18">
          <polygon points="0,-2 0,2 4,6 18,6 18,-6 4,-6" fill="var(--surface)" stroke={neutral} strokeWidth={1.2} />
          <circle cx={0} cy={0} r={1} fill={neutral} />
        </svg>
        Release tag
      </span>
    </div>
  );
}

export function PlanningBoard() {
  const [codelines, setCodelines] = useState([]);
  const [commits, setCommits] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingCodeline, setIsAddingCodeline] = useState(false);
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [isAddingPlannedCommit, setIsAddingPlannedCommit] = useState(false);
  const [isAddingPlannedEvent, setIsAddingPlannedEvent] = useState(false);
  const theme = useColorScheme();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [cl, pc, pe] = await Promise.all([
          api.listCodelines(),
          api.listPlannedCommits(),
          api.listPlannedEvents(),
        ]);
        if (cancelled) return;
        setCodelines(cl);
        setCommits(pc);
        setEvents(pe);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const orderedCodelines = useMemo(
    () => [...codelines].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [codelines],
  );

  const diagrams = useMemo(
    () => buildGitGraphScripts(codelines, commits, events, { theme }),
    [codelines, commits, events, theme],
  );

  return (
    <div className="viz-root">
      <div className="board-header">
        <div>
          <h1>plangit — planning board</h1>
          {error && <p style={{ color: STATUS_COLOR.slipped }}>Error: {error}</p>}
        </div>
        <div className="board-header-actions">
          <button type="button" className="board-add-button" onClick={() => setIsAddingCodeline(true)}>
            + Add codeline
          </button>
          <button
            type="button"
            className="board-add-button"
            disabled={orderedCodelines.length === 0}
            title={orderedCodelines.length === 0 ? 'Add a codeline first' : undefined}
            onClick={() => setIsAddingBranch(true)}
          >
            + Add branch
          </button>
          <button
            type="button"
            className="board-add-button"
            disabled={orderedCodelines.length === 0}
            title={orderedCodelines.length === 0 ? 'Add a codeline first' : undefined}
            onClick={() => setIsAddingPlannedCommit(true)}
          >
            + Add planned commit
          </button>
          <button
            type="button"
            className="board-add-button"
            disabled={orderedCodelines.length === 0}
            title={orderedCodelines.length === 0 ? 'Add a codeline first' : undefined}
            onClick={() => setIsAddingPlannedEvent(true)}
          >
            + Add planned event
          </button>
        </div>
      </div>
      <BoardLegend />
      {isAddingCodeline && (
        <AddCodelineModal
          codelines={orderedCodelines}
          onClose={() => setIsAddingCodeline(false)}
          onCreated={(created) => setCodelines((prev) => [...prev, created])}
        />
      )}
      {isAddingBranch && (
        <AddCodelineModal
          codelines={orderedCodelines}
          requireParent
          onClose={() => setIsAddingBranch(false)}
          onCreated={(created) => setCodelines((prev) => [...prev, created])}
        />
      )}
      {isAddingPlannedCommit && (
        <AddPlannedCommitModal
          codelines={orderedCodelines}
          onClose={() => setIsAddingPlannedCommit(false)}
          onCreated={(created) => setCommits((prev) => [...prev, created])}
        />
      )}
      {isAddingPlannedEvent && (
        <AddPlannedEventModal
          codelines={orderedCodelines}
          onClose={() => setIsAddingPlannedEvent(false)}
          onCreated={(created) => setEvents((prev) => [...prev, created])}
        />
      )}
      {loading ? (
        <p className="board-empty">Loading plan…</p>
      ) : orderedCodelines.length === 0 ? (
        <p className="board-empty">
          No codelines yet — create one via the API to start planning (e.g. <code>POST /api/codelines</code>).
        </p>
      ) : (
        <div className="board-body">
          {diagrams.map((d) => (
            <GitGraphDiagram key={d.rootId} script={d.script} />
          ))}
        </div>
      )}
    </div>
  );
}
