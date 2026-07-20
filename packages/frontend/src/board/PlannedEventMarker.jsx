import { STATUS_COLOR, STATUS_LABEL } from './colors.js';

const CURVE_OFFSET = 18;

function typeLabel(type) {
  if (type === 'BRANCH_CREATE') return 'Branch create';
  if (type === 'MERGE') return 'Merge';
  return 'Release tag';
}

function TagGlyph({ color }) {
  return <path d="M -6 -6 L 6 -6 L 6 4 L 0 10 L -6 4 Z" fill={color} stroke="var(--surface)" strokeWidth={1} />;
}

export function PlannedEventMarker({ x, sourceY, targetY, type, status, plannedDate, laneColor, isDragging, onPointerDown }) {
  const statusColor = STATUS_COLOR[status];
  const strokeColor = statusColor ?? laneColor;
  const tooltip = `${typeLabel(type)} — ${STATUS_LABEL[status] ?? status} (${plannedDate})`;

  const isCurve = type === 'BRANCH_CREATE' || type === 'MERGE';

  return (
    <g
      transform={`translate(${x}, 0)`}
      onPointerDown={onPointerDown}
      style={{ cursor: 'grab', opacity: isDragging ? 0.7 : 1 }}
    >
      <title>{tooltip}</title>
      {isCurve && targetY != null && (
        <path
          d={`M 0 ${sourceY} C ${CURVE_OFFSET} ${sourceY} ${-CURVE_OFFSET} ${targetY} 0 ${targetY}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2}
          strokeDasharray={type === 'MERGE' ? '5 3' : undefined}
        />
      )}
      <g transform={`translate(0, ${sourceY})`}>
        {type === 'RELEASE_TAG' ? <TagGlyph color={strokeColor} /> : <circle r={5} fill={strokeColor} />}
      </g>
      {isCurve && targetY != null && (
        <circle cx={0} cy={targetY} r={5} fill={strokeColor} />
      )}
    </g>
  );
}
