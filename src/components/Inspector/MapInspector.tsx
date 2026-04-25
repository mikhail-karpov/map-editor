import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useMapStore, useDoc } from '@/store/mapStore';
import { saveBgImage, clearBgImage } from '@/lib/storage';

const SCALE_MIN = 25;
const SCALE_MAX = 400;

type Props = {
  bgObjectUrl: string | null;
  onBgAttached: (
    url: string,
    geom: { x: number; y: number; width: number; height: number }
  ) => void;
  onBgCleared: () => void;
};

export function MapInspector({ bgObjectUrl, onBgAttached, onBgCleared }: Props) {
  const doc = useDoc();
  const {
    renameMap,
    setBackgroundGeometry,
    clearBackground,
    beginTransaction,
    commitTransaction,
    resizeBorder,
  } = useMapStore();
  const fileRef = useRef<HTMLInputElement>(null);

  // null = not editing (show doc value); string = user is typing
  const [editingW, setEditingW] = useState<string | null>(null);
  const [editingH, setEditingH] = useState<string | null>(null);

  function commitBorderSize(rawW: string, rawH: string) {
    const w = Math.max(200, Number(rawW) || doc.border.width);
    const h = Math.max(200, Number(rawH) || doc.border.height);
    beginTransaction();
    resizeBorder({ x: doc.border.x, y: doc.border.y, width: w, height: h });
    commitTransaction();
    setEditingW(null);
    setEditingH(null);
  }

  function onBorderKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
  }

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
        x: doc.background?.x ?? 0,
        y: doc.background?.y ?? 0,
        width: img.naturalWidth,
        height: img.naturalHeight,
        scale: doc.background?.scale ?? 1,
        opacity: doc.background?.opacity ?? 0.5,
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

  function handleScaleChange(value: number) {
    if (!doc.background) return;
    setBackgroundGeometry({ ...doc.background, scale: value / 100 });
  }

  function handleScaleCommit() {
    commitTransaction();
  }

  function handleScaleReset() {
    if (!doc.background) return;
    beginTransaction();
    setBackgroundGeometry({ ...doc.background, scale: 1 });
    commitTransaction();
  }

  const currentOpacity = doc.background?.opacity ?? 0.5;
  const opacityPercent = Math.round(currentOpacity * 100);

  function handleOpacityChange(value: number) {
    if (!doc.background) return;
    setBackgroundGeometry({ ...doc.background, opacity: value / 100 });
  }

  function handleOpacityCommit() {
    commitTransaction();
  }

  function handleOpacityReset() {
    if (!doc.background) return;
    beginTransaction();
    setBackgroundGeometry({ ...doc.background, opacity: 0.5 });
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
        <Label className="text-xs text-muted-foreground mb-1 block">Border size</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">W</Label>
            <Input
              type="number"
              min={200}
              value={editingW ?? doc.border.width}
              onChange={(e) => setEditingW(e.target.value)}
              onBlur={() =>
                commitBorderSize(
                  editingW ?? String(doc.border.width),
                  editingH ?? String(doc.border.height)
                )
              }
              onKeyDown={onBorderKeyDown}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">H</Label>
            <Input
              type="number"
              min={200}
              value={editingH ?? doc.border.height}
              onChange={(e) => setEditingH(e.target.value)}
              onBlur={() =>
                commitBorderSize(
                  editingW ?? String(doc.border.width),
                  editingH ?? String(doc.border.height)
                )
              }
              onKeyDown={onBorderKeyDown}
              className="h-8 text-sm"
            />
          </div>
        </div>
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
        <>
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
            <div onPointerDown={beginTransaction}>
              <Slider
                min={SCALE_MIN}
                max={SCALE_MAX}
                step={1}
                value={scalePercent}
                onValueChange={handleScaleChange}
                onValueCommitted={handleScaleCommit}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Opacity</Label>
              <div className="flex items-center gap-1.5">
                <span className="text-xs tabular-nums w-9 text-right">{opacityPercent}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-xs"
                  disabled={opacityPercent === 50}
                  onClick={handleOpacityReset}
                >
                  Reset
                </Button>
              </div>
            </div>
            <div onPointerDown={beginTransaction}>
              <Slider
                min={0}
                max={100}
                step={1}
                value={opacityPercent}
                onValueChange={handleOpacityChange}
                onValueCommitted={handleOpacityCommit}
              />
            </div>
          </div>
        </>
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
