import type { Terrain } from '@/types/map';

export const TERRAIN_LABELS: Record<Terrain, string> = {
  plains: 'plains',
  forest: 'forest',
  city: 'city',
};

export const TERRAIN_COLORS: Record<Terrain, string> = {
  plains: '#b7e4b5',
  forest: '#2f6b3a',
  city: '#7a4b2a',
};

export const TERRAIN_STROKE: Record<Terrain, string> = {
  plains: '#7dbf79',
  forest: '#1e4826',
  city: '#4e2e18',
};

export const TERRAIN_LABEL_COLOR: Record<Terrain, string> = {
  plains: '#1a3d18',
  forest: '#1e4826',
  city: '#4e2e18',
};

export const TERRAINS: Terrain[] = ['plains', 'forest', 'city'];

export const ZONE_RADIUS = 8;
