import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMapStore } from './mapStore';
import { DEFAULT_MAP_BORDER } from '@/constants/mapBorder';
import { makeDoc } from '@/test/fixtures';
import type { MapDoc } from '@/types/map';

vi.mock('@/lib/storage', () => ({
  saveMap: vi.fn(),
  loadMap: vi.fn(),
  saveBgImage: vi.fn(),
  loadBgImage: vi.fn(),
  clearBgImage: vi.fn(),
}));

const initialMap = useMapStore.getState();
beforeEach(() => useMapStore.setState(initialMap, true));

// ─── Default state ───────────────────────────────────────────────────────────

describe('default state', () => {
  it('starts with name My Map, empty zones/edges, empty history, no selection', () => {
    const { doc, past, future, selection } = useMapStore.getState();
    expect(doc.name).toBe('My Map');
    expect(doc.zones).toEqual([]);
    expect(doc.edges).toEqual([]);
    expect(doc.border).toEqual(DEFAULT_MAP_BORDER);
    expect(past).toEqual([]);
    expect(future).toEqual([]);
    expect(selection).toEqual({ kind: 'none' });
  });
});

// ─── Zones ───────────────────────────────────────────────────────────────────

describe('createZone', () => {
  it('returns an id and appends a zone at given coords with defaults', () => {
    const id = useMapStore.getState().createZone(10, 20);
    const { zones } = useMapStore.getState().doc;
    expect(zones).toHaveLength(1);
    expect(zones[0]).toMatchObject({ id, x: 10, y: 20, terrain: 'plains', label: '', tags: [] });
  });
});

describe('moveZone', () => {
  it('updates coords for matching zone only', () => {
    const id1 = useMapStore.getState().createZone(0, 0);
    const id2 = useMapStore.getState().createZone(5, 5);
    useMapStore.getState().moveZone(id1, 99, 88);
    const { zones } = useMapStore.getState().doc;
    expect(zones.find((z) => z.id === id1)).toMatchObject({ x: 99, y: 88 });
    expect(zones.find((z) => z.id === id2)).toMatchObject({ x: 5, y: 5 });
  });
});

describe('updateZone', () => {
  it('merges patch fields; non-matching ids untouched', () => {
    const id1 = useMapStore.getState().createZone(0, 0);
    const id2 = useMapStore.getState().createZone(0, 0);
    useMapStore.getState().updateZone(id1, { label: 'Capital', terrain: 'city' });
    const { zones } = useMapStore.getState().doc;
    expect(zones.find((z) => z.id === id1)).toMatchObject({ label: 'Capital', terrain: 'city' });
    expect(zones.find((z) => z.id === id2)).toMatchObject({ label: '' });
  });
});

describe('deleteZone', () => {
  it('removes the zone and all edges touching it, clears selection', () => {
    const id1 = useMapStore.getState().createZone(0, 0);
    const id2 = useMapStore.getState().createZone(0, 0);
    useMapStore.getState().createEdge(id1, id2);
    useMapStore.getState().select({ kind: 'zone', id: id1 });
    useMapStore.getState().deleteZone(id1);
    const { doc, selection } = useMapStore.getState();
    expect(doc.zones.find((z) => z.id === id1)).toBeUndefined();
    expect(doc.edges).toHaveLength(0);
    expect(selection).toEqual({ kind: 'none' });
  });
});

// ─── Edges ───────────────────────────────────────────────────────────────────

describe('createEdge', () => {
  it('appends an edge with default type secondary', () => {
    useMapStore.getState().createEdge('za', 'zb');
    const { edges } = useMapStore.getState().doc;
    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ a: 'za', b: 'zb', type: 'secondary' });
  });

  it('is a no-op for self-edges', () => {
    useMapStore.getState().createEdge('za', 'za');
    expect(useMapStore.getState().doc.edges).toHaveLength(0);
  });

  it('is a no-op for duplicate edges regardless of direction', () => {
    useMapStore.getState().createEdge('za', 'zb');
    useMapStore.getState().createEdge('zb', 'za');
    expect(useMapStore.getState().doc.edges).toHaveLength(1);
  });
});

describe('updateEdge', () => {
  it('updates the edge type', () => {
    useMapStore.getState().createEdge('za', 'zb');
    const id = useMapStore.getState().doc.edges[0].id;
    useMapStore.getState().updateEdge(id, { type: 'primary' });
    expect(useMapStore.getState().doc.edges[0].type).toBe('primary');
  });
});

describe('deleteEdge', () => {
  it('removes the edge and clears selection', () => {
    useMapStore.getState().createEdge('za', 'zb');
    const id = useMapStore.getState().doc.edges[0].id;
    useMapStore.getState().select({ kind: 'edge', id });
    useMapStore.getState().deleteEdge(id);
    expect(useMapStore.getState().doc.edges).toHaveLength(0);
    expect(useMapStore.getState().selection).toEqual({ kind: 'none' });
  });
});

// ─── History ─────────────────────────────────────────────────────────────────

describe('undo / redo', () => {
  it('mutating action pushes to past', () => {
    useMapStore.getState().createZone(0, 0);
    expect(useMapStore.getState().past).toHaveLength(1);
  });

  it('undo restores prior doc, moves entry to future', () => {
    useMapStore.getState().createZone(0, 0);
    useMapStore.getState().undo();
    expect(useMapStore.getState().doc.zones).toHaveLength(0);
    expect(useMapStore.getState().future).toHaveLength(1);
  });

  it('redo re-applies the change and shrinks future', () => {
    useMapStore.getState().createZone(0, 0);
    useMapStore.getState().undo();
    useMapStore.getState().redo();
    expect(useMapStore.getState().doc.zones).toHaveLength(1);
    expect(useMapStore.getState().future).toHaveLength(0);
  });

  it('undo is a no-op when past is empty', () => {
    const docBefore = useMapStore.getState().doc;
    useMapStore.getState().undo();
    expect(useMapStore.getState().doc).toEqual(docBefore);
  });

  it('redo is a no-op when future is empty', () => {
    useMapStore.getState().createZone(0, 0);
    const docBefore = useMapStore.getState().doc;
    useMapStore.getState().redo();
    expect(useMapStore.getState().doc).toEqual(docBefore);
  });

  it('new mutation after undo clears the future stack', () => {
    useMapStore.getState().createZone(0, 0);
    useMapStore.getState().undo();
    expect(useMapStore.getState().future).toHaveLength(1);
    useMapStore.getState().createZone(5, 5);
    expect(useMapStore.getState().future).toHaveLength(0);
  });

  it('history is capped at MAX_HISTORY (100)', () => {
    for (let i = 0; i < 105; i++) {
      useMapStore.getState().renameMap(`Map ${i}`);
    }
    expect(useMapStore.getState().past.length).toBe(100);
  });
});

// ─── Transactions ─────────────────────────────────────────────────────────────

describe('transactions', () => {
  it('beginTransaction + multiple mutations + commitTransaction pushes exactly one history entry', () => {
    const id = useMapStore.getState().createZone(0, 0);
    const pastLengthBefore = useMapStore.getState().past.length;
    useMapStore.getState().beginTransaction();
    useMapStore.getState().moveZone(id, 10, 10);
    useMapStore.getState().moveZone(id, 20, 20);
    useMapStore.getState().moveZone(id, 30, 30);
    useMapStore.getState().commitTransaction();
    expect(useMapStore.getState().past.length).toBe(pastLengthBefore + 1);
  });

  it('abortTransaction restores pre-transaction doc and pushes nothing to history', () => {
    const id = useMapStore.getState().createZone(0, 0);
    const docBefore = useMapStore.getState().doc;
    const pastLengthBefore = useMapStore.getState().past.length;
    useMapStore.getState().beginTransaction();
    useMapStore.getState().moveZone(id, 99, 99);
    useMapStore.getState().abortTransaction();
    expect(useMapStore.getState().doc.zones.find((z) => z.id === id)).toMatchObject({ x: 0, y: 0 });
    expect(useMapStore.getState().past.length).toBe(pastLengthBefore);
    expect(useMapStore.getState().doc.zones).toEqual(docBefore.zones);
  });

  it('commitTransaction without open transaction is a no-op', () => {
    useMapStore.getState().createZone(0, 0);
    const pastLength = useMapStore.getState().past.length;
    useMapStore.getState().commitTransaction();
    expect(useMapStore.getState().past.length).toBe(pastLength);
  });

  it('abortTransaction without open transaction is a no-op', () => {
    const id = useMapStore.getState().createZone(10, 10);
    useMapStore.getState().abortTransaction();
    expect(useMapStore.getState().doc.zones.find((z) => z.id === id)).toMatchObject({
      x: 10,
      y: 10,
    });
  });
});

// ─── Map metadata ─────────────────────────────────────────────────────────────

describe('renameMap', () => {
  it('updates name and pushes history', () => {
    useMapStore.getState().renameMap('New Name');
    expect(useMapStore.getState().doc.name).toBe('New Name');
    expect(useMapStore.getState().past).toHaveLength(1);
  });
});

describe('background', () => {
  it('setBackgroundGeometry sets background; clearBackground removes it', () => {
    const geom = { x: 0, y: 0, width: 800, height: 600 };
    useMapStore.getState().setBackgroundGeometry(geom);
    expect(useMapStore.getState().doc.background).toMatchObject(geom);
    useMapStore.getState().clearBackground();
    expect(useMapStore.getState().doc.background).toBeUndefined();
  });
});

describe('resizeBorder', () => {
  it('replaces the border', () => {
    const newBorder = { x: 10, y: 20, width: 800, height: 600 };
    useMapStore.getState().resizeBorder(newBorder);
    expect(useMapStore.getState().doc.border).toEqual(newBorder);
  });
});

// ─── replaceDoc ───────────────────────────────────────────────────────────────

describe('replaceDoc', () => {
  it('replaces doc, clears history, future, selection, _txSnapshot', () => {
    useMapStore.getState().createZone(0, 0);
    useMapStore.getState().undo();
    useMapStore.getState().select({ kind: 'zone', id: 'z1' });
    const newDoc = makeDoc({ name: 'Imported' });
    useMapStore.getState().replaceDoc(newDoc);
    const state = useMapStore.getState();
    expect(state.doc.name).toBe('Imported');
    expect(state.past).toEqual([]);
    expect(state.future).toEqual([]);
    expect(state.selection).toEqual({ kind: 'none' });
    expect(state._txSnapshot).toBeNull();
  });

  it('substitutes DEFAULT_MAP_BORDER when border is missing', () => {
    const docWithoutBorder = { name: 'X', zones: [], edges: [] } as unknown as MapDoc;
    useMapStore.getState().replaceDoc(docWithoutBorder);
    expect(useMapStore.getState().doc.border).toEqual(DEFAULT_MAP_BORDER);
  });

  it('substitutes DEFAULT_MAP_BORDER when border width is <= 0', () => {
    const docBadBorder = {
      name: 'X',
      zones: [],
      edges: [],
      border: { x: 0, y: 0, width: 0, height: 100 },
    } as MapDoc;
    useMapStore.getState().replaceDoc(docBadBorder);
    expect(useMapStore.getState().doc.border).toEqual(DEFAULT_MAP_BORDER);
  });

  it('defaults x and y to 0 when border only has width/height', () => {
    const docPartialBorder = {
      name: 'X',
      zones: [],
      edges: [],
      border: { width: 200, height: 100 },
    } as unknown as MapDoc;
    useMapStore.getState().replaceDoc(docPartialBorder);
    expect(useMapStore.getState().doc.border).toEqual({ x: 0, y: 0, width: 200, height: 100 });
  });
});

// ─── newMap ───────────────────────────────────────────────────────────────────

describe('newMap', () => {
  it('resets to default doc with empty history', () => {
    useMapStore.getState().createZone(0, 0);
    useMapStore.getState().renameMap('Old Name');
    useMapStore.getState().newMap();
    const state = useMapStore.getState();
    expect(state.doc.name).toBe('My Map');
    expect(state.doc.zones).toEqual([]);
    expect(state.past).toEqual([]);
    expect(state.future).toEqual([]);
  });
});

// ─── Selection ────────────────────────────────────────────────────────────────

describe('select', () => {
  it('updates selection without pushing to history', () => {
    useMapStore.getState().select({ kind: 'zone', id: 'z1' });
    expect(useMapStore.getState().selection).toEqual({ kind: 'zone', id: 'z1' });
    expect(useMapStore.getState().past).toHaveLength(0);
  });
});
