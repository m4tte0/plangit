const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_WINDOW_DAYS = 30;

export function startOfDay(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function addDays(date, n) {
  return new Date(date.getTime() + n * DAY_MS);
}

export function toISODateString(date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

// Builds a padded [start, end] window covering every date passed in, or a
// default window anchored on today when there's no data yet.
export function buildDateRange(dates, { paddingDays = 5, defaultWindowDays = DEFAULT_WINDOW_DAYS } = {}) {
  const valid = dates.filter(Boolean).map((d) => startOfDay(d).getTime());
  if (valid.length === 0) {
    const today = startOfDay(new Date());
    return { start: today, end: addDays(today, defaultWindowDays) };
  }
  const start = addDays(new Date(Math.min(...valid)), -paddingDays);
  const end = addDays(new Date(Math.max(...valid)), paddingDays);
  return { start, end };
}

// A linear date <-> x-pixel scale, day-granular (snaps to whole days).
export function createDateScale({ start, pixelsPerDay = 40 }) {
  const startTime = startOfDay(start).getTime();
  return {
    pixelsPerDay,
    dateToX(date) {
      const days = (startOfDay(date).getTime() - startTime) / DAY_MS;
      return days * pixelsPerDay;
    },
    xToDate(x) {
      const days = Math.round(x / pixelsPerDay);
      return addDays(new Date(startTime), days);
    },
    widthBetween(startDate, endDate) {
      const days = Math.round((startOfDay(endDate).getTime() - startOfDay(startDate).getTime()) / DAY_MS);
      return days * pixelsPerDay;
    },
  };
}
