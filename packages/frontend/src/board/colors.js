// Validated default palette (see the dataviz skill's references/palette.md).
// Categorical hues are assigned in this fixed order — never cycled per-instance,
// never chosen ad hoc — so a lane's color stays CVD-safe relative to its neighbors.
export const CATEGORICAL_PALETTE = [
  '#2a78d6', // blue
  '#008300', // green
  '#e87ba4', // magenta
  '#eda100', // yellow
  '#1baf7a', // aqua
  '#eb6834', // orange
  '#4a3aa7', // violet
  '#e34948', // red
];

export function categoricalColor(index) {
  return CATEGORICAL_PALETTE[index % CATEGORICAL_PALETTE.length];
}

// Status is a fixed, reserved palette — never reused for lane identity.
// "planned" has no status color: it's the neutral default state, shown as an
// unfilled ring rather than implying good/bad.
export const STATUS_COLOR = {
  in_progress: '#fab219', // warning
  done: '#0ca30c', // good
  slipped: '#d03b3b', // critical
};

export const STATUS_LABEL = {
  planned: 'Planned',
  in_progress: 'In progress',
  done: 'Done',
  slipped: 'Slipped',
};

export const INK = {
  surface: '#fcfcfb',
  primary: '#0b0b0b',
  secondary: '#52514e',
  muted: '#898781',
  gridline: '#e1e0d9',
  baseline: '#c3c2b7',
};
