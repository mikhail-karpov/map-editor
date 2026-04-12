import type { Zone } from '@/types/map';
import type { SelectionState } from '@/types/map';
import {
  TERRAIN_COLORS,
  TERRAIN_STROKE,
  TERRAIN_LABEL_COLOR,
  ZONE_RADIUS,
} from '@/constants/terrain';

const SELECTION_RING_RADIUS = ZONE_RADIUS + 5;
const SELECTION_RING_COLOR = '#6366f1';

type Props = {
  zones: Zone[];
  selection: SelectionState;
  connectSourceId: string | null;
  onZonePointerDown: (id: string, e: React.PointerEvent) => void;
};

export function ZonesLayer({ zones, selection, connectSourceId, onZonePointerDown }: Props) {
  return (
    <g>
      {zones.map((zone) => {
        const isSelected = selection.kind === 'zone' && selection.id === zone.id;
        const isConnectSource = connectSourceId === zone.id;
        const fill = TERRAIN_COLORS[zone.terrain];
        const stroke = TERRAIN_STROKE[zone.terrain];
        const textColor = TERRAIN_LABEL_COLOR[zone.terrain];

        return (
          <g key={zone.id}>
            {/* Selection / connect-source ring */}
            {(isSelected || isConnectSource) && (
              <circle
                cx={zone.x}
                cy={zone.y}
                r={SELECTION_RING_RADIUS}
                fill="none"
                stroke={SELECTION_RING_COLOR}
                strokeWidth={2.5}
                style={{ pointerEvents: 'none' }}
              />
            )}
            {/* Zone circle */}
            <circle
              cx={zone.x}
              cy={zone.y}
              r={ZONE_RADIUS}
              fill={fill}
              stroke={stroke}
              strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onPointerDown={(e) => onZonePointerDown(zone.id, e)}
            />
            {/* Label below circle */}
            <text
              x={zone.x}
              y={zone.y + ZONE_RADIUS + 14}
              textAnchor="middle"
              fontSize={11}
              fill={textColor}
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {zone.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
