import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { gitColor, STATUS_COLOR } from './colors.js';
import { CodelineLane } from './CodelineLane.jsx';
import { PlannedCommitNode } from './PlannedCommitNode.jsx';
import { PlannedEventMarker } from './PlannedEventMarker.jsx';
import { AddCodelineModal } from './AddCodelineModal.jsx';
import { AddPlannedCommitModal } from './AddPlannedCommitModal.jsx';
import { AddPlannedEventModal } from './AddPlannedEventModal.jsx';
import './board.css';

const ROW_HEIGHT = 72;
const TOP_PADDING = 64;
const RIGHT_PADDING = 60;
const COLUMN_WIDTH = 80;
const LEFT_PADDING = 40;

// GitGraph-style sequence positioning: every planned item (and every
// non-root codeline's branch point) is one more step right of the previous
// one in date order — not proportional to how many days apart they are
// (Mermaid's default temporal model has no literal calendar scale).
function useColumns(orderedCodelines, commits, events) {
  return useMemo(() => {
    const points = [];
    orderedCodelines.forEach((cl) => {
      if (cl.branch_point_date) {
        points.push({ key: `codeline:${cl.id}`, date: cl.branch_point_date, tiebreak: cl.created_at });
      }
    });
    commits.forEach((c) => {
      points.push({ key: `commit:${c.id}`, date: c.planned_date, tiebreak: c.created_at });
    });
    events.forEach((e) => {
      points.push({ key: `event:${e.id}`, date: e.planned_date, tiebreak: e.created_at });
    });
    points.sort((a, b) => {
      const dateDiff = new Date(a.date) - new Date(b.date);
      if (dateDiff !== 0) return dateDiff;
      const tieDiff = new Date(a.tiebreak) - new Date(b.tiebreak);
      if (tieDiff !== 0) return tieDiff;
      return a.key.localeCompare(b.key);
    });
    const map = new Map();
    points.forEach((p, i) => map.set(p.key, i));
    return map;
  }, [orderedCodelines, commits, events]);
}

function columnToX(index) {
  return LEFT_PADDING + index * COLUMN_WIDTH;
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

  const laneIndexById = useMemo(() => {
    const map = new Map();
    orderedCodelines.forEach((cl, i) => map.set(cl.id, i));
    return map;
  }, [orderedCodelines]);

  const laneColorById = useMemo(() => {
    const map = new Map();
    orderedCodelines.forEach((cl, i) => map.set(cl.id, cl.color || gitColor(i)));
    return map;
  }, [orderedCodelines]);

  const columnByKey = useColumns(orderedCodelines, commits, events);
  const maxColumn = columnByKey.size > 0 ? columnByKey.size - 1 : 0;
  const timelineWidth = columnToX(maxColumn) + RIGHT_PADDING;
  const totalHeight = TOP_PADDING + orderedCodelines.length * ROW_HEIGHT;

  function laneY(codelineId) {
    const idx = laneIndexById.get(codelineId);
    if (idx == null) return null;
    return TOP_PADDING + idx * ROW_HEIGHT + ROW_HEIGHT / 2;
  }

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
          <div className="board-lane-labels">
            <div style={{ height: TOP_PADDING }} />
            {orderedCodelines.map((cl) => (
              <div
                key={cl.id}
                className="board-lane-label"
                style={{ height: ROW_HEIGHT, color: laneColorById.get(cl.id) }}
              >
                {cl.name}
              </div>
            ))}
          </div>
          <div className="board-timeline-scroll">
            <svg width={timelineWidth} height={totalHeight}>
              {orderedCodelines.map((cl) => {
                const y = laneY(cl.id);
                const laneStart = cl.branch_point_date
                  ? columnToX(columnByKey.get(`codeline:${cl.id}`))
                  : LEFT_PADDING;
                return (
                  <CodelineLane
                    key={cl.id}
                    y={y}
                    startX={laneStart}
                    endX={columnToX(maxColumn)}
                    color={laneColorById.get(cl.id)}
                  />
                );
              })}
              {events.map((ev) => {
                const sourceY = laneY(ev.source_codeline_id);
                const targetY = ev.target_codeline_id ? laneY(ev.target_codeline_id) : null;
                const colIndex = columnByKey.get(`event:${ev.id}`);
                if (sourceY == null || colIndex == null) return null;
                return (
                  <PlannedEventMarker
                    key={ev.id}
                    x={columnToX(colIndex)}
                    sourceY={sourceY}
                    targetY={targetY}
                    type={ev.type}
                    status={ev.status}
                    plannedDate={ev.planned_date}
                    sourceColor={laneColorById.get(ev.source_codeline_id)}
                    targetColor={ev.target_codeline_id ? laneColorById.get(ev.target_codeline_id) : undefined}
                  />
                );
              })}
              {commits.map((commit) => {
                const y = laneY(commit.codeline_id);
                const colIndex = columnByKey.get(`commit:${commit.id}`);
                if (y == null || colIndex == null) return null;
                return (
                  <PlannedCommitNode
                    key={commit.id}
                    x={columnToX(colIndex)}
                    y={y}
                    title={commit.title}
                    status={commit.status}
                    plannedDate={commit.planned_date}
                    color={laneColorById.get(commit.codeline_id)}
                    isMilestone={Boolean(commit.milestone_id)}
                  />
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
