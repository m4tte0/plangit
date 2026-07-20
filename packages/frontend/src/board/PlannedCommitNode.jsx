import { STATUS_COLOR, STATUS_LABEL } from './colors.js';

const RADIUS = 9;

function StatusGlyph({ status, color }) {
  if (status === 'done') {
    // Small checkmark, drawn in the surface color so it reads against the fill.
    return <path d="M -4 0 L -1.5 3 L 4 -4" stroke="var(--surface)" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  }
  if (status === 'slipped') {
    return (
      <>
        <line x1={0} y1={-4} x2={0} y2={1} stroke="var(--surface)" strokeWidth={1.5} strokeLinecap="round" />
        <circle cx={0} cy={4} r={1} fill="var(--surface)" />
      </>
    );
  }
  if (status === 'in_progress') {
    return <circle r={RADIUS + 3} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />;
  }
  return null;
}

export function PlannedCommitNode({ x, y, title, status, plannedDate, isDragging, onPointerDown }) {
  const color = STATUS_COLOR[status];
  const fill = color ?? 'var(--surface)';
  const stroke = color ?? 'var(--text-muted)';

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onPointerDown={onPointerDown}
      style={{ cursor: 'grab', opacity: isDragging ? 0.7 : 1 }}
    >
      <title>
        {title} — {STATUS_LABEL[status] ?? status} ({plannedDate})
      </title>
      <circle r={RADIUS} fill={fill} stroke={stroke} strokeWidth={2} />
      <StatusGlyph status={status} color={color} />
    </g>
  );
}
