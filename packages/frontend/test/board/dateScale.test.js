import { describe, it, expect } from 'vitest';
import { buildDateRange, createDateScale, toISODateString, addDays, startOfDay } from '../../src/board/dateScale.js';

describe('buildDateRange', () => {
  it('pads a window around the min and max of the given dates', () => {
    const { start, end } = buildDateRange(['2026-08-10', '2026-08-01', '2026-08-20'], { paddingDays: 3 });
    expect(toISODateString(start)).toBe('2026-07-29');
    expect(toISODateString(end)).toBe('2026-08-23');
  });

  it('falls back to a default window anchored on today when there is no data', () => {
    const { start, end } = buildDateRange([], { defaultWindowDays: 30 });
    expect(toISODateString(start)).toBe(toISODateString(new Date()));
    expect(toISODateString(end)).toBe(toISODateString(addDays(startOfDay(new Date()), 30)));
  });

  it('ignores null/undefined dates mixed in with valid ones', () => {
    const { start, end } = buildDateRange([null, '2026-08-01', undefined], { paddingDays: 0 });
    expect(toISODateString(start)).toBe('2026-08-01');
    expect(toISODateString(end)).toBe('2026-08-01');
  });
});

describe('createDateScale', () => {
  const scale = createDateScale({ start: '2026-08-01', pixelsPerDay: 40 });

  it('maps the start date to x=0', () => {
    expect(scale.dateToX('2026-08-01')).toBe(0);
  });

  it('maps later dates to positive multiples of pixelsPerDay', () => {
    expect(scale.dateToX('2026-08-11')).toBe(400);
  });

  it('round-trips x -> date -> x', () => {
    const x = scale.dateToX('2026-08-15');
    const date = scale.xToDate(x);
    expect(scale.dateToX(date)).toBe(x);
  });

  it('snaps xToDate to the nearest whole day', () => {
    const date = scale.xToDate(365); // 9.125 days
    expect(toISODateString(date)).toBe(toISODateString(addDays(startOfDay('2026-08-01'), 9)));
  });

  it('widthBetween computes day-count * pixelsPerDay', () => {
    expect(scale.widthBetween('2026-08-01', '2026-08-06')).toBe(200);
  });
});
