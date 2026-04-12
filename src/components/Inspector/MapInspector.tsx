import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useMapStore, useDoc } from '@/store/mapStore';
import { saveBgImage, clearBgImage } from '@/lib/storage';

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
  const { renameMap, setBackgroundGeometry, clearBackground } = useMapStore();
  const fileRef = useRef<HTMLInputElement>(null);

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
      const geom = { offsetX: 0, offsetY: 0, width: img.naturalWidth, height: img.naturalHeight };
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
