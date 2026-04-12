import type { Edge, Zone } from '@/types/map';
import { EDGE_STYLES, EDGE_SELECTED_STYLE, EDGE_HIT_WIDTH } from '@/constants/edgeTypes';
import type { SelectionState } from '@/types/map';

type Props = {
  edges: Edge[];
  zones: Zone[];
  selection: SelectionState;
  onEdgeClick: (id: string, e: React.PointerEvent) => void;
};

function getZone(zones: Zone[], id: string): Zone | undefined {
  return zones.find((z) => z.id === id);
}

export function EdgesLayer({ edges, zones, selection, onEdgeClick }: Props) {
  return (
    <g>
      {edges.map((edge) => {
        const za = getZone(zones, edge.a);
        const zb = getZone(zones, edge.b);
        if (!za || !zb) return null;

        const isSelected = selection.kind === 'edge' && selection.id === edge.id;
        const style = EDGE_STYLES[edge.type];

        return (
          <g key={edge.id}>
            {/* Selection highlight underneath */}
            {isSelected && (
              <line
                x1={za.x}
                y1={za.y}
                x2={zb.x}
                y2={zb.y}
                stroke={EDGE_SELECTED_STYLE.stroke}
                strokeWidth={EDGE_SELECTED_STYLE.strokeWidth}
                strokeLinecap="round"
                style={{ pointerEvents: 'none' }}
              />
            )}
            {/* Actual edge */}
            <line
              x1={za.x}
              y1={za.y}
              x2={zb.x}
              y2={zb.y}
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              strokeDasharray={style.strokeDasharray}
              strokeLinecap="round"
              style={{ pointerEvents: 'none' }}
            />
            {/* Invisible wide hit target */}
            <line
              x1={za.x}
              y1={za.y}
              x2={zb.x}
              y2={zb.y}
              stroke="transparent"
              strokeWidth={EDGE_HIT_WIDTH}
              style={{ cursor: 'pointer' }}
              onPointerDown={(e) => onEdgeClick(edge.id, e)}
            />
          </g>
        );
      })}
    </g>
  );
}
