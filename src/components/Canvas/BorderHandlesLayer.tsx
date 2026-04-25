import type { MapBorder } from '@/types/map';

export type HandleId = 'tl' | 't' | 'tr' | 'r' | 'br' | 'b' | 'bl' | 'l';

type HandleDef = {
  id: HandleId;
  cx: (w: number, h: number) => number;
  cy: (w: number, h: number) => number;
  cursor: string;
};

const HANDLES: HandleDef[] = [
  { id: 'tl', cx: () => 0, cy: () => 0, cursor: 'nwse-resize' },
  { id: 't', cx: (w) => w / 2, cy: () => 0, cursor: 'ns-resize' },
  { id: 'tr', cx: (w) => w, cy: () => 0, cursor: 'nesw-resize' },
  { id: 'r', cx: (w) => w, cy: (_, h) => h / 2, cursor: 'ew-resize' },
  { id: 'br', cx: (w) => w, cy: (_, h) => h, cursor: 'nwse-resize' },
  { id: 'b', cx: (w) => w / 2, cy: (_, h) => h, cursor: 'ns-resize' },
  { id: 'bl', cx: () => 0, cy: (_, h) => h, cursor: 'nesw-resize' },
  { id: 'l', cx: () => 0, cy: (_, h) => h / 2, cursor: 'ew-resize' },
];

const HANDLE_SIZE = 10;

type Props = {
  border: MapBorder;
  onHandlePointerDown: (handle: HandleId, e: React.PointerEvent<SVGRectElement>) => void;
};

export function BorderHandlesLayer({ border, onHandlePointerDown }: Props) {
  const { x: bx, y: by, width: w, height: h } = border;

  return (
    <>
      {HANDLES.map(({ id, cx, cy, cursor }) => {
        const x = bx + cx(w, h);
        const y = by + cy(w, h);
        return (
          <rect
            key={id}
            x={x - HANDLE_SIZE / 2}
            y={y - HANDLE_SIZE / 2}
            width={HANDLE_SIZE}
            height={HANDLE_SIZE}
            vectorEffect="non-scaling-stroke"
            style={{
              fill: 'white',
              stroke: 'var(--primary)',
              strokeWidth: 1.5,
              cursor,
              pointerEvents: 'all',
            }}
            onPointerDown={(e) => onHandlePointerDown(id, e)}
          />
        );
      })}
    </>
  );
}
