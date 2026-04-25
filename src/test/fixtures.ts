import type { Zone, Edge, MapDoc } from '@/types/map';
import { DEFAULT_MAP_BORDER } from '@/constants/mapBorder';

export const makeZone = (overrides: Partial<Zone> = {}): Zone => ({
  id: 'z1',
  label: '',
  terrain: 'plains',
  tags: [],
  x: 0,
  y: 0,
  ...overrides,
});

export const makeEdge = (overrides: Partial<Edge> = {}): Edge => ({
  id: 'e1',
  type: 'secondary',
  a: 'z1',
  b: 'z2',
  ...overrides,
});

export const makeDoc = (overrides: Partial<MapDoc> = {}): MapDoc => ({
  name: 'Test Map',
  zones: [],
  edges: [],
  border: DEFAULT_MAP_BORDER,
  ...overrides,
});
