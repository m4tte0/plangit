import { addDays, startOfDay, toISODateString } from './dateScale.js';
import { INK } from './colors.js';

const WEEK_DAYS = 7;

function formatTickLabel(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function CalendarAxis({ scale, start, end, axisHeight, height }) {
  const ticks = [];
  let cursor = startOfDay(start);
  const last = startOfDay(end);
  while (cursor.getTime() <= last.getTime()) {
    ticks.push(cursor);
    cursor = addDays(cursor, WEEK_DAYS);
  }

  return (
    <g>
      {ticks.map((date) => {
        const x = scale.dateToX(date);
        return (
          <g key={toISODateString(date)}>
            <line x1={x} x2={x} y1={axisHeight} y2={height} stroke={INK.gridline} strokeWidth={1} />
            <text x={x + 4} y={axisHeight - 10} fontSize={11} fill={INK.muted}>
              {formatTickLabel(date)}
            </text>
          </g>
        );
      })}
      <line x1={0} x2={scale.widthBetween(start, end)} y1={axisHeight} y2={axisHeight} stroke={INK.baseline} strokeWidth={1} />
    </g>
  );
}
