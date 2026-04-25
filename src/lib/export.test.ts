import { describe, it, expect, vi, afterEach } from 'vitest';
import { parseImport, exportMap } from './export';
import { makeDoc, makeZone, makeEdge } from '@/test/fixtures';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parseImport', () => {
  it('accepts a valid v1 export', () => {
    const zone = makeZone({ id: 'z1', label: 'Plains', x: 10, y: 20 });
    const edge = makeEdge({ id: 'e1', a: 'z1', b: 'z2' });
    const raw = JSON.stringify({
      version: 1,
      map: {
        name: 'My Map',
        zones: [zone],
        edges: [edge],
        border: { x: 0, y: 0, width: 1600, height: 1000 },
      },
    });
    const result = parseImport(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.doc.zones).toHaveLength(1);
      expect(result.doc.edges).toHaveLength(1);
    }
  });

  it('rejects malformed JSON', () => {
    const result = parseImport('{bad json}');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/not valid JSON/i);
  });

  it('rejects non-object root', () => {
    const result = parseImport('"just a string"');
    expect(result.ok).toBe(false);
  });

  it('rejects wrong version', () => {
    const result = parseImport(JSON.stringify({ version: 2, map: {} }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/version/i);
  });

  it('rejects missing version', () => {
    const result = parseImport(JSON.stringify({ map: {} }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/version/i);
  });

  it('rejects missing map field', () => {
    const result = parseImport(JSON.stringify({ version: 1 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/map/i);
  });

  it('rejects non-string name', () => {
    const result = parseImport(
      JSON.stringify({ version: 1, map: { name: 42, zones: [], edges: [] } })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/name/i);
  });

  it('rejects non-array zones', () => {
    const result = parseImport(
      JSON.stringify({ version: 1, map: { name: 'X', zones: 'bad', edges: [] } })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/zones/i);
  });

  it('rejects non-array edges', () => {
    const result = parseImport(
      JSON.stringify({ version: 1, map: { name: 'X', zones: [], edges: null } })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/edges/i);
  });

  it('rejects zone with missing required fields', () => {
    const badZone = { id: 'z1', label: 'Test' }; // missing x, y
    const result = parseImport(
      JSON.stringify({ version: 1, map: { name: 'X', zones: [badZone], edges: [] } })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/zone/i);
  });

  it('rejects edge with missing required fields', () => {
    const badEdge = { id: 'e1', a: 'z1' }; // missing b
    const result = parseImport(
      JSON.stringify({ version: 1, map: { name: 'X', zones: [], edges: [badEdge] } })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/edge/i);
  });

  it('accepts doc without background (optional field)', () => {
    const raw = JSON.stringify({
      version: 1,
      map: { name: 'X', zones: [], edges: [], border: { x: 0, y: 0, width: 100, height: 100 } },
    });
    const result = parseImport(raw);
    expect(result.ok).toBe(true);
  });

  it('rejects malformed background geometry', () => {
    const raw = JSON.stringify({
      version: 1,
      map: { name: 'X', zones: [], edges: [], background: { x: 0 } },
    });
    const result = parseImport(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/background/i);
  });
});

describe('exportMap', () => {
  it('creates a download anchor with the correct filename and triggers click', () => {
    const click = vi.fn();
    const anchor = { href: '', download: '', click } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const createObjectURL = vi.fn(() => 'blob:x');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    exportMap(makeDoc({ name: 'My Map' }));

    expect(anchor.download).toBe('My Map.json');
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:x');
  });

  it("falls back to 'map.json' when doc.name is empty", () => {
    const click = vi.fn();
    const anchor = { href: '', download: '', click } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:x'), revokeObjectURL: vi.fn() });

    exportMap(makeDoc({ name: '' }));

    expect(anchor.download).toBe('map.json');
  });
});
