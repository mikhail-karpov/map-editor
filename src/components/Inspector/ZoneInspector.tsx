import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMapStore, useZoneById } from '@/store/mapStore';
import { TERRAIN_LABELS, TERRAINS } from '@/constants/terrain';
import type { Tag, Terrain } from '@/types/map';

type Props = {
  zoneId: string;
};

export function ZoneInspector({ zoneId }: Props) {
  const zone = useZoneById(zoneId);
  const { updateZone, deleteZone } = useMapStore();
  const [newTagKey, setNewTagKey] = useState('');
  const [newTagValue, setNewTagValue] = useState('');

  if (!zone) return null;

  function handleAddTag() {
    if (!newTagKey.trim()) return;
    const existing = zone!.tags.find((t) => t.key === newTagKey.trim());
    if (existing) return; // duplicate key
    const tags: Tag[] = [...zone!.tags, { key: newTagKey.trim(), value: newTagValue }];
    updateZone(zoneId, { tags });
    setNewTagKey('');
    setNewTagValue('');
  }

  function handleUpdateTag(index: number, field: 'key' | 'value', val: string) {
    const tags = zone!.tags.map((t, i) => (i === index ? { ...t, [field]: val } : t));
    updateZone(zoneId, { tags });
  }

  function handleRemoveTag(index: number) {
    const tags = zone!.tags.filter((_, i) => i !== index);
    updateZone(zoneId, { tags });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Label */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Label</Label>
        <Input
          value={zone.label}
          onChange={(e) => updateZone(zoneId, { label: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      {/* Terrain */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Terrain</Label>
        <Select
          value={zone.terrain}
          onValueChange={(v) => updateZone(zoneId, { terrain: v as Terrain })}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TERRAINS.map((t) => (
              <SelectItem key={t} value={t}>
                {TERRAIN_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Owner */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Owner</Label>
        <Input
          value={zone.owner ?? ''}
          onChange={(e) => updateZone(zoneId, { owner: e.target.value || undefined })}
          placeholder="None"
          className="h-8 text-sm"
        />
      </div>

      {/* Tags */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1 block">Tags</Label>
        <div className="flex flex-col gap-1">
          {zone.tags.map((tag, i) => (
            <div key={i} className="flex gap-1 items-center">
              <Input
                value={tag.key}
                onChange={(e) => handleUpdateTag(i, 'key', e.target.value)}
                placeholder="key"
                className="h-7 text-xs w-24 flex-shrink-0"
              />
              <span className="text-muted-foreground text-xs">=</span>
              <Input
                value={tag.value}
                onChange={(e) => handleUpdateTag(i, 'value', e.target.value)}
                placeholder="value"
                className="h-7 text-xs flex-1"
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 flex-shrink-0"
                onClick={() => handleRemoveTag(i)}
                aria-label="Remove tag"
              >
                <Trash2 size={12} />
              </Button>
            </div>
          ))}

          {/* Add tag row */}
          <div className="flex gap-1 items-center mt-0.5">
            <Input
              value={newTagKey}
              onChange={(e) => setNewTagKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="key"
              className="h-7 text-xs w-24 flex-shrink-0"
            />
            <span className="text-muted-foreground text-xs">=</span>
            <Input
              value={newTagValue}
              onChange={(e) => setNewTagValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              placeholder="value"
              className="h-7 text-xs flex-1"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 flex-shrink-0"
              onClick={handleAddTag}
              aria-label="Add tag"
            >
              <Plus size={12} />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete */}
      <Button
        variant="destructive"
        size="sm"
        className="w-full mt-1 text-xs"
        onClick={() => deleteZone(zoneId)}
      >
        Delete zone
      </Button>
    </div>
  );
}
