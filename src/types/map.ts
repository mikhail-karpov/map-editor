export type Terrain = 'plains' | 'forest' | 'city';
export type EdgeType = 'primary' | 'secondary' | 'trail';

export type Tag = { key: string; value: string };

export type Zone = {
  id: string;
  label: string;
  terrain: Terrain;
  owner?: string;
  tags: Tag[];
  x: number;
  y: number;
};

export type Edge = {
  id: string;
  type: EdgeType;
  a: string;
  b: string;
};

export type BackgroundGeometry = {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

export type MapDoc = {
  name: string;
  zones: Zone[];
  edges: Edge[];
  background?: BackgroundGeometry;
};

export type ExportedMap = {
  version: 1;
  map: MapDoc;
};

export type SelectionState =
  | { kind: 'none' }
  | { kind: 'zone'; id: string }
  | { kind: 'edge'; id: string };
