import type { MapBorder } from '@/types/map';
import type { Tool } from '@/store/toolStore';
import { BORDER_STROKE_COLOR, BORDER_STROKE_WIDTH } from '@/constants/mapBorder';

type Props = {
  border: MapBorder;
  activeTool: Tool;
};

export function MapBorderLayer({ border, activeTool }: Props) {
  const isEditing = activeTool === 'adjustBorder';
  return (
    <rect
      x={border.x}
      y={border.y}
      width={border.width}
      height={border.height}
      fill="none"
      strokeWidth={BORDER_STROKE_WIDTH}
      style={{
        pointerEvents: 'none',
        stroke: isEditing ? 'var(--primary)' : BORDER_STROKE_COLOR,
        strokeDasharray: isEditing ? '4 4' : undefined,
      }}
    />
  );
}
