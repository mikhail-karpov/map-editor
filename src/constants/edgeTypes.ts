import type { EdgeType } from '@/types/map';

export const EDGE_TYPE_LABELS: Record<EdgeType, string> = {
  primary: 'Primary',
  secondary: 'Secondary',
  trail: 'Trail',
};

export type EdgeStyle = {
  stroke: string;
  strokeWidth: number;
  strokeDasharray?: string;
};

export const EDGE_STYLES: Record<EdgeType, EdgeStyle> = {
  primary: { stroke: '#222222', strokeWidth: 4 },
  secondary: { stroke: '#666666', strokeWidth: 2.5 },
  trail: { stroke: '#555555', strokeWidth: 2.5, strokeDasharray: '6 4' },
};

export const EDGE_SELECTED_STYLE: EdgeStyle = {
  stroke: '#6366f1',
  strokeWidth: 6,
};

export const EDGE_HIT_WIDTH = 12;

export const EDGE_TYPES: EdgeType[] = ['primary', 'secondary', 'trail'];
