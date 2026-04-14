import { create } from 'zustand';
import { newId } from '@/lib/id';
import type {
  MapDoc,
  Zone,
  Edge,
  Terrain,
  EdgeType,
  Tag,
  SelectionState,
  BackgroundGeometry,
} from '@/types/map';
import { DEFAULT_MAP_BORDER } from '@/constants/mapBorder';

const MAX_HISTORY = 100;

function defaultDoc(): MapDoc {
  return { name: 'My Map', zones: [], edges: [], border: DEFAULT_MAP_BORDER };
}

function deepClone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val));
}

type MapState = {
  doc: MapDoc;
  selection: SelectionState;
  past: MapDoc[];
  future: MapDoc[];
  /** When non-null we are inside a drag transaction; next moves skip push */
  _txSnapshot: MapDoc | null;
};

type MapActions = {
  // History
  undo: () => void;
  redo: () => void;
  beginTransaction: () => void;
  commitTransaction: () => void;
  abortTransaction: () => void;

  // Document mutations
  createZone: (x: number, y: number) => string;
  moveZone: (id: string, x: number, y: number) => void;
  updateZone: (id: string, patch: Partial<Omit<Zone, 'id'>>) => void;
  deleteZone: (id: string) => void;
  createEdge: (a: string, b: string, type?: EdgeType) => void;
  updateEdge: (id: string, patch: Partial<Omit<Edge, 'id'>>) => void;
  deleteEdge: (id: string) => void;
  renameMap: (name: string) => void;
  setBackgroundGeometry: (geom: BackgroundGeometry) => void;
  clearBackground: () => void;
  replaceDoc: (doc: MapDoc) => void;
  newMap: () => void;
  resizeBorder: (params: { x: number; y: number; width: number; height: number }) => void;

  // Selection (no history)
  select: (sel: SelectionState) => void;
};

export type MapStore = MapState & MapActions;

/** Push current doc to past; clear future */
function pushHistory(state: MapState): Partial<MapState> {
  if (state._txSnapshot !== null) return {}; // inside transaction — skip
  const past = [...state.past, deepClone(state.doc)];
  if (past.length > MAX_HISTORY) past.shift();
  return { past, future: [] };
}

export const useMapStore = create<MapStore>()((set, get) => ({
  doc: defaultDoc(),
  selection: { kind: 'none' },
  past: [],
  future: [],
  _txSnapshot: null,

  // ── History ──────────────────────────────────────────────────────────────

  undo() {
    const { past, doc, future } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      doc: deepClone(prev),
      past: past.slice(0, -1),
      future: [deepClone(doc), ...future].slice(0, MAX_HISTORY),
      selection: { kind: 'none' },
    });
  },

  redo() {
    const { future, doc, past } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      doc: deepClone(next),
      future: future.slice(1),
      past: [...past, deepClone(doc)].slice(-MAX_HISTORY),
      selection: { kind: 'none' },
    });
  },

  beginTransaction() {
    set({ _txSnapshot: deepClone(get().doc) });
  },

  commitTransaction() {
    const snap = get()._txSnapshot;
    if (!snap) return;
    const past = [...get().past, snap];
    if (past.length > MAX_HISTORY) past.shift();
    set({ _txSnapshot: null, past, future: [] });
  },

  abortTransaction() {
    const snap = get()._txSnapshot;
    if (!snap) return;
    set({ doc: snap, _txSnapshot: null });
  },

  // ── Document mutations ───────────────────────────────────────────────────

  createZone(x, y) {
    const id = newId();
    set((s) => ({
      ...pushHistory(s),
      doc: {
        ...s.doc,
        zones: [
          ...s.doc.zones,
          {
            id,
            label: ``,
            terrain: 'plains' as Terrain,
            tags: [],
            x,
            y,
          },
        ],
      },
    }));
    return id;
  },

  moveZone(id, x, y) {
    set((s) => ({
      ...pushHistory(s),
      doc: {
        ...s.doc,
        zones: s.doc.zones.map((z) => (z.id === id ? { ...z, x, y } : z)),
      },
    }));
  },

  updateZone(id, patch) {
    set((s) => ({
      ...pushHistory(s),
      doc: {
        ...s.doc,
        zones: s.doc.zones.map((z) => (z.id === id ? { ...z, ...patch } : z)),
      },
    }));
  },

  deleteZone(id) {
    set((s) => ({
      ...pushHistory(s),
      doc: {
        ...s.doc,
        zones: s.doc.zones.filter((z) => z.id !== id),
        edges: s.doc.edges.filter((e) => e.a !== id && e.b !== id),
      },
      selection: { kind: 'none' },
    }));
  },

  createEdge(a, b, type = 'secondary') {
    if (a === b) return; // no self-edges
    const { edges } = get().doc;
    const exists = edges.some((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
    if (exists) return;
    const id = newId();
    set((s) => ({
      ...pushHistory(s),
      doc: {
        ...s.doc,
        edges: [...s.doc.edges, { id, type, a, b }],
      },
    }));
  },

  updateEdge(id, patch) {
    set((s) => ({
      ...pushHistory(s),
      doc: {
        ...s.doc,
        edges: s.doc.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      },
    }));
  },

  deleteEdge(id) {
    set((s) => ({
      ...pushHistory(s),
      doc: {
        ...s.doc,
        edges: s.doc.edges.filter((e) => e.id !== id),
      },
      selection: { kind: 'none' },
    }));
  },

  renameMap(name) {
    set((s) => ({
      ...pushHistory(s),
      doc: { ...s.doc, name },
    }));
  },

  setBackgroundGeometry(geom) {
    set((s) => ({
      ...pushHistory(s),
      doc: { ...s.doc, background: geom },
    }));
  },

  clearBackground() {
    set((s) => ({
      ...pushHistory(s),
      doc: { ...s.doc, background: undefined },
    }));
  },

  replaceDoc(doc: MapDoc) {
    const b = doc.border;
    const border =
      b && typeof b.width === 'number' && b.width > 0 && typeof b.height === 'number' && b.height > 0
        ? { x: b.x ?? 0, y: b.y ?? 0, width: b.width, height: b.height }
        : DEFAULT_MAP_BORDER;
    set({
      doc: { ...doc, border },
      past: [],
      future: [],
      selection: { kind: 'none' },
      _txSnapshot: null,
    });
  },

  newMap() {
    set({
      doc: defaultDoc(),
      past: [],
      future: [],
      selection: { kind: 'none' },
      _txSnapshot: null,
    });
  },

  resizeBorder(params: { x: number; y: number; width: number; height: number }) {
    set((s) => ({
      ...pushHistory(s),
      doc: {
        ...s.doc,
        border: params,
      },
    }));
  },

  // ── Selection ────────────────────────────────────────────────────────────

  select(sel) {
    set({ selection: sel });
  },
}));

export function useDoc() {
  return useMapStore((s) => s.doc);
}

export function useSelection() {
  return useMapStore((s) => s.selection);
}

export function useCanUndo() {
  return useMapStore((s) => s.past.length > 0);
}

export function useCanRedo() {
  return useMapStore((s) => s.future.length > 0);
}

export function useZoneById(id: string) {
  return useMapStore((s) => s.doc.zones.find((z) => z.id === id));
}

export function useEdgeById(id: string) {
  return useMapStore((s) => s.doc.edges.find((e) => e.id === id));
}

export function useZoneTags(id: string): Tag[] {
  return useMapStore((s) => s.doc.zones.find((z) => z.id === id)?.tags ?? []);
}
