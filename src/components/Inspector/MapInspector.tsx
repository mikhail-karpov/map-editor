import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useMapStore, useDoc } from '@/store/mapStore';
import { saveBgImage, clearBgImage } from '@/lib/storage';

const SCALE_MIN = 25;
const SCALE_MAX = 400;

type Props = {
  bgObjectUrl: string | null;
  onBgAttached: (
    url: string,
    geom: { offsetX: number; offsetY: number; width: number; height: number }
  ) => void;
  onBgCleared: () => void;
};

export function MapInspector({ bgObjectUrl, onBgAttached, onBgCleared }: Props) {
  const doc = useDoc();
  const { renameMap, setBackgroundGeometry, clearBackground, beginTransaction, commitTransaction } =
    useMapStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const currentScale = doc.background?.scale ?? 1;
  const scalePercent = Math.round(currentScale * 100);

  function handleAttach() {
    fileRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const geom = {
        offsetX: 0,
        offsetY: 0,
        width: img.naturalWidth,
        height: img.naturalHeight,
        scale: doc.background?.scale ?? 1,
      };
      setBackgroundGeometry(geom);
      saveBgImage(file);
      onBgAttached(url, geom);
    };
    img.src = url;
  }

  function handleClearBg() {
    clearBackground();
    clearBgImage();
    onBgCleared();
  }

  function handleScalePointerDown() {
    beginTransaction();
  }

  function handleScaleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!doc.background) return;
    const scale = Number(e.target.value) / 100;
    setBackgroundGeometry({ ...doc.background, scale });
  }

  function handleScalePointerUp() {
    commitTransaction();
  }

  function handleScaleReset() {
    if (!doc.background) return;
    beginTransaction();
    setBackgroundGeometry({ ...doc.background, scale: 1 });
    commitTransaction();
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Map name</Label>
        <Input
          value={doc.name}
          onChange={(e) => renameMap(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Background image</Label>
        {bgObjectUrl ? (
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleClearBg}>
            Clear background image
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleAttach}>
            Attach background image
          </Button>
        )}
      </div>

      {bgObjectUrl && doc.background && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-muted-foreground">Scale</Label>
            <div className="flex items-center gap-1.5">
              <span className="text-xs tabular-nums w-9 text-right">{scalePercent}%</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-xs"
                disabled={scalePercent === 100}
                onClick={handleScaleReset}
              >
                Reset
              </Button>
            </div>
          </div>
          <input
            type="range"
            min={SCALE_MIN}
            max={SCALE_MAX}
            step={1}
            value={scalePercent}
            list="scale-snap"
            className="w-full accent-primary"
            onPointerDown={handleScalePointerDown}
            onChange={handleScaleChange}
            onPointerUp={handleScalePointerUp}
          />
          <datalist id="scale-snap">
            <option value={100} />
          </datalist>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
