import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMapStore, useEdgeById, useDoc } from '@/store/mapStore';
import { EDGE_TYPE_LABELS, EDGE_TYPES } from '@/constants/edgeTypes';
import type { EdgeType } from '@/types/map';

type Props = {
  edgeId: string;
};

export function EdgeInspector({ edgeId }: Props) {
  const edge = useEdgeById(edgeId);
  const doc = useDoc();
  const { updateEdge, deleteEdge } = useMapStore();

  if (!edge) return null;

  const zoneA = doc.zones.find((z) => z.id === edge.a);
  const zoneB = doc.zones.find((z) => z.id === edge.b);

  return (
    <div className="flex flex-col gap-3">
      {/* Connected zones */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Connects</Label>
        <div className="text-sm rounded-md border border-border px-2 py-1.5 bg-muted/40">
          {zoneA?.label ?? 'Unknown'} ↔ {zoneB?.label ?? 'Unknown'}
        </div>
      </div>

      {/* Edge type */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
        <Select
          value={edge.type}
          onValueChange={(v) => updateEdge(edgeId, { type: v as EdgeType })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EDGE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {EDGE_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Delete */}
      <Button
        variant="destructive"
        size="sm"
        className="w-full mt-1 text-xs"
        onClick={() => deleteEdge(edgeId)}
      >
        Delete edge
      </Button>
    </div>
  );
}
