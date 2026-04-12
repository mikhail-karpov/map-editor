type Props = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export function GhostLine({ x1, y1, x2, y2 }: Props) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="#6366f1"
      strokeWidth={2}
      strokeDasharray="6 4"
      strokeLinecap="round"
      opacity={0.7}
      style={{ pointerEvents: 'none' }}
    />
  );
}
