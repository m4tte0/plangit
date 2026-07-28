import { STATUS_LABEL } from './colors.js';

const CURVE_OFFSET = 18;
const RADIUS = 10;
const MERGE_INNER_RADIUS = 6;

function typeLabel(type) {
  if (type === 'BRANCH_CREATE') return 'Branch create';
  if (type === 'MERGE') return 'Merge';
  return 'Release tag';
}

// Mermaid's tag: a pointed-left flag with a hole near the tip, floating above
// the commit on a leader line. Geometry measured off a rendered gitGraph
// (mermaid.live, default theme) and re-anchored to the hole, not copied
// verbatim — see colors.js note on why these are measured rather than
// sourced from a hex/constant table.
const TAG_HOLE_Y = -24;
const TAG_POINTS = [
  [-4, TAG_HOLE_Y + 2],
  [-4, TAG_HOLE_Y - 2],
  [4, TAG_HOLE_Y - 7.5],
  [32.8, TAG_HOLE_Y - 7.5],
  [32.8, TAG_HOLE_Y + 7.5],
  [4, TAG_HOLE_Y + 7.5],
]
  .map(([px, py]) => `${px},${py}`)
  .join(' ');

function TagFlag({ color }) {
  return (
    <>
      <line x1={0} y1={TAG_HOLE_Y + 2} x2={0} y2={-RADIUS} stroke={color} strokeWidth={1.5} />
      <polygon points={TAG_POINTS} fill="var(--surface)" stroke={color} strokeWidth={1.5} />
      <circle cx={0} cy={TAG_HOLE_Y} r={1.5} fill={color} />
    </>
  );
}

export function PlannedEventMarker({ x, sourceY, targetY, type, status, plannedDate, sourceColor, targetColor }) {
  const tooltip = `${typeLabel(type)} — ${STATUS_LABEL[status] ?? status} (${plannedDate?.slice(0, 10)})`;
  const isCurve = type === 'BRANCH_CREATE' || type === 'MERGE';
  const isMerge = type === 'MERGE';

  return (
    <g transform={`translate(${x}, 0)`}>
      <title>{tooltip}</title>
      {isCurve && targetY != null && (
        <path
          d={`M 0 ${sourceY} C ${CURVE_OFFSET} ${sourceY} ${-CURVE_OFFSET} ${targetY} 0 ${targetY}`}
          fill="none"
          stroke={isMerge ? targetColor : sourceColor}
          strokeWidth={2}
        />
      )}
      {type === 'RELEASE_TAG' ? (
        <g transform={`translate(0, ${sourceY})`}>
          <TagFlag color={sourceColor} />
        </g>
      ) : (
        <circle cx={0} cy={sourceY} r={RADIUS} fill={sourceColor} stroke={sourceColor} strokeWidth={2} />
      )}
      {isCurve && targetY != null && (
        isMerge ? (
          <g transform={`translate(0, ${targetY})`}>
            <circle r={RADIUS} fill={targetColor} stroke={targetColor} strokeWidth={2} />
            <circle r={MERGE_INNER_RADIUS} fill="var(--surface)" />
          </g>
        ) : (
          <circle cx={0} cy={targetY} r={RADIUS} fill={targetColor} stroke={targetColor} strokeWidth={2} />
        )
      )}
    </g>
  );
}
