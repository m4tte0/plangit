import { STATUS_LABEL } from './colors.js';

const RADIUS = 10;
const HIGHLIGHT_OUTER = 20;
const HIGHLIGHT_INNER = 12;

// Mermaid's REVERSE cross, measured off a rendered gitGraph (see colors.js note).
function SlippedCross() {
  return (
    <path
      d="M -5 -5 L 5 5 M -5 5 L 5 -5"
      stroke="var(--surface)"
      strokeWidth={2}
      strokeLinecap="round"
    />
  );
}

// Mermaid's HIGHLIGHT shape: an outer filled square with a lighter inner
// square "hole" — reused here for commits linked to a milestone.
function MilestoneSquare() {
  const half = HIGHLIGHT_OUTER / 2;
  const innerHalf = HIGHLIGHT_INNER / 2;
  return (
    <>
      <rect x={-half} y={-half} width={HIGHLIGHT_OUTER} height={HIGHLIGHT_OUTER} fill="var(--text-primary)" />
      <rect x={-innerHalf} y={-innerHalf} width={HIGHLIGHT_INNER} height={HIGHLIGHT_INNER} fill="var(--surface)" />
    </>
  );
}

export function PlannedCommitNode({ x, y, title, status, plannedDate, color, isMilestone }) {
  const isSlipped = status === 'slipped';
  // planned_date comes back from the API as a full ISO timestamp; only the
  // date portion is meaningful here.
  const dateLabel = plannedDate?.slice(0, 10);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <title>
        {title} — {STATUS_LABEL[status] ?? status} ({dateLabel})
      </title>
      {isMilestone ? (
        <MilestoneSquare />
      ) : (
        <>
          <circle r={RADIUS} fill={color} stroke={color} strokeWidth={2} />
          {isSlipped && <SlippedCross />}
        </>
      )}
      <text x={8} y={-14} fontSize={10} fill="var(--text-secondary)" transform="rotate(-45 8 -14)">
        {dateLabel}
      </text>
    </g>
  );
}
