export function CodelineLane({ y, startX, endX, color }) {
  return <line x1={startX} x2={endX} y1={y} y2={y} stroke={color} strokeWidth={3} strokeLinecap="round" />;
}
