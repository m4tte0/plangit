// Mermaid gitGraph "default" theme's git0-git7 branch colors, read directly
// off a rendered diagram (mermaid.live, default theme) rather than guessed —
// the theme computes these from color-math on primary/secondary/tertiary
// base colors at render time, so there's no fixed hex literal to copy from
// source. See https://mermaid.js.org/syntax/gitgraph.html.
export const GIT_COLORS = [
  '#0000ec', // git0
  '#dede00', // git1
  '#9dec00', // git2
  '#0076ec', // git3
  '#00ecec', // git4
  '#00ec76', // git5
  '#ec00ec', // git6
  '#ec0000', // git7
];

export function gitColor(index) {
  return GIT_COLORS[index % GIT_COLORS.length];
}

// Kept only for the error banner's critical-red text; commit/branch color is
// now purely git-color (see GIT_COLORS) per GitGraph compliance.
export const STATUS_COLOR = {
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
