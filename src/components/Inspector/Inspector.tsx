import { useSelection } from '@/store/mapStore';
import { MapInspector } from './MapInspector';
import { ZoneInspector } from './ZoneInspector';
import { EdgeInspector } from './EdgeInspector';
import { cn } from '@/lib/utils';

type Props = {
  bgObjectUrl: string | null;
  onBgAttached: (
    url: string,
    geom: {
      x: number;
      y: number;
      width: number;
      height: number;
    }
  ) => void;
  onBgCleared: () => void;
};

export function Inspector({ bgObjectUrl, onBgAttached, onBgCleared }: Props) {
  const selection = useSelection();

  const title = selection.kind === 'zone' ? 'Zone' : selection.kind === 'edge' ? 'Edge' : 'Map';

  return (
    <div
      className={cn(
        'fixed top-3 right-3 z-20 w-56',
        'rounded-xl border border-border bg-background/90 backdrop-blur px-3 py-3 shadow-md',
        'max-h-[calc(100vh-1.5rem)] overflow-y-auto'
      )}
    >
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        {title}
      </h2>

      {selection.kind === 'none' && (
        <MapInspector
          bgObjectUrl={bgObjectUrl}
          onBgAttached={onBgAttached}
          onBgCleared={onBgCleared}
        />
      )}
      {selection.kind === 'zone' && <ZoneInspector zoneId={selection.id} />}
      {selection.kind === 'edge' && <EdgeInspector edgeId={selection.id} />}
    </div>
  );
}
