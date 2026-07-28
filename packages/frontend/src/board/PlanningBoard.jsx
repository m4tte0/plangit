import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client.js';
import { buildDateRange, createDateScale, toISODateString, addDays, startOfDay } from './dateScale.js';
import { categoricalColor, STATUS_COLOR, STATUS_LABEL } from './colors.js';
import { CalendarAxis } from './CalendarAxis.jsx';
import { CodelineLane } from './CodelineLane.jsx';
import { PlannedCommitNode } from './PlannedCommitNode.jsx';
import { PlannedEventMarker } from './PlannedEventMarker.jsx';
import { AddCodelineModal } from './AddCodelineModal.jsx';
import { AddPlannedCommitModal } from './AddPlannedCommitModal.jsx';
import { AddPlannedEventModal } from './AddPlannedEventModal.jsx';
import './board.css';

const ROW_HEIGHT = 64;
const AXIS_HEIGHT = 40;
const PIXELS_PER_DAY = 40;

function BoardLegend() {
  const items = ['planned', 'in_progress', 'done', 'slipped'];
  return (
    <div className="board-legend">
      {items.map((status) => (
        <span key={status} className="board-legend-item">
          <span
            className="board-legend-swatch"
            style={{ background: STATUS_COLOR[status] ?? 'transparent', border: `1px solid var(--text-muted)` }}
          />
          {STATUS_LABEL[status]}
        </span>
      ))}
    </div>
  );
}

export function PlanningBoard() {
  const [codelines, setCodelines] = useState([]);
  const [commits, setCommits] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dragState, setDragState] = useState(null);
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
    orderedCodelines.forEach((cl, i) => map.set(cl.id, cl.color || categoricalColor(i)));
    return map;
  }, [orderedCodelines]);

  const allDates = useMemo(
    () => [
      ...orderedCodelines.map((c) => c.branch_point_date),
      ...commits.map((c) => c.planned_date),
      ...events.map((e) => e.planned_date),
    ],
    [orderedCodelines, commits, events],
  );

  const { start, end } = useMemo(() => buildDateRange(allDates), [allDates]);
  const scale = useMemo(() => createDateScale({ start, pixelsPerDay: PIXELS_PER_DAY }), [start]);
  const timelineWidth = scale.widthBetween(start, end);
  const totalHeight = AXIS_HEIGHT + orderedCodelines.length * ROW_HEIGHT;

  function laneY(codelineId) {
    const idx = laneIndexById.get(codelineId);
    if (idx == null) return null;
    return AXIS_HEIGHT + idx * ROW_HEIGHT + ROW_HEIGHT / 2;
  }

  useEffect(() => {
    if (!dragState) return undefined;

    function handleMove(e) {
      setDragState((prev) => prev && { ...prev, deltaX: e.clientX - prev.pointerStartX });
    }

    async function commitDrag(drag) {
      const dayDelta = Math.round(drag.deltaX / PIXELS_PER_DAY);
      if (dayDelta === 0) return;
      const newDate = toISODateString(addDays(startOfDay(drag.originalDate), dayDelta));
      try {
        if (drag.kind === 'commit') {
          const updated = await api.updatePlannedCommit(drag.id, { planned_date: newDate });
          setCommits((prev) => prev.map((c) => (c.id === drag.id ? updated : c)));
        } else {
          const updated = await api.updatePlannedEvent(drag.id, { planned_date: newDate });
          setEvents((prev) => prev.map((e) => (e.id === drag.id ? updated : e)));
        }
      } catch (err) {
        setError(err.message);
      }
    }

    function handleUp() {
      setDragState((prev) => {
        if (prev) commitDrag(prev);
        return null;
      });
    }

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragState]);

  function startDrag(kind, id, originalDate) {
    return (e) => {
      e.preventDefault();
      setDragState({ kind, id, pointerStartX: e.clientX, originalDate, deltaX: 0 });
    };
  }

  function effectiveX(item, kind) {
    const baseX = scale.dateToX(item.planned_date);
    if (dragState && dragState.kind === kind && dragState.id === item.id) {
      const snappedDelta = Math.round(dragState.deltaX / PIXELS_PER_DAY) * PIXELS_PER_DAY;
      return baseX + snappedDelta;
    }
    return baseX;
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
            <div style={{ height: AXIS_HEIGHT }} />
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
            <svg width={timelineWidth + 20} height={totalHeight}>
              <CalendarAxis scale={scale} start={start} end={end} axisHeight={AXIS_HEIGHT} height={totalHeight} />
              {orderedCodelines.map((cl) => {
                const y = laneY(cl.id);
                const laneStart = cl.branch_point_date ? scale.dateToX(cl.branch_point_date) : 0;
                return (
                  <CodelineLane
                    key={cl.id}
                    y={y}
                    startX={laneStart}
                    endX={timelineWidth}
                    color={laneColorById.get(cl.id)}
                  />
                );
              })}
              {events.map((ev) => {
                const sourceY = laneY(ev.source_codeline_id);
                const targetY = ev.target_codeline_id ? laneY(ev.target_codeline_id) : null;
                if (sourceY == null) return null;
                return (
                  <PlannedEventMarker
                    key={ev.id}
                    x={effectiveX(ev, 'event')}
                    sourceY={sourceY}
                    targetY={targetY}
                    type={ev.type}
                    status={ev.status}
                    plannedDate={ev.planned_date}
                    laneColor={laneColorById.get(ev.source_codeline_id)}
                    isDragging={dragState?.kind === 'event' && dragState.id === ev.id}
                    onPointerDown={startDrag('event', ev.id, ev.planned_date)}
                  />
                );
              })}
              {commits.map((commit) => {
                const y = laneY(commit.codeline_id);
                if (y == null) return null;
                return (
                  <PlannedCommitNode
                    key={commit.id}
                    x={effectiveX(commit, 'commit')}
                    y={y}
                    title={commit.title}
                    status={commit.status}
                    plannedDate={commit.planned_date}
                    isDragging={dragState?.kind === 'commit' && dragState.id === commit.id}
                    onPointerDown={startDrag('commit', commit.id, commit.planned_date)}
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
