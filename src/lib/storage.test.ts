import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { saveMap, loadMap, saveBgImage, loadBgImage, clearBgImage } from './storage';
import { DEFAULT_MAP_BORDER } from '@/constants/mapBorder';
import { makeDoc } from '@/test/fixtures';
import type { MapDoc } from '@/types/map';

beforeEach(() => {
  localStorage.clear();
  return clearBgImage();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── saveMap / loadMap ────────────────────────────────────────────────────────

describe('saveMap / loadMap', () => {
  it('round-trips a doc through localStorage', () => {
    const doc = makeDoc({ name: 'Round Trip', zones: [], edges: [] });
    saveMap(doc);
    expect(loadMap()).toEqual(doc);
  });

  it('returns null when nothing is saved', () => {
    expect(loadMap()).toBeNull();
  });

  it('returns null when stored value is malformed JSON', () => {
    localStorage.setItem('mapEditor:doc', '{bad json}');
    expect(loadMap()).toBeNull();
  });

  it('defaults background.scale to 1 when missing', () => {
    const doc = makeDoc({
      background: { x: 0, y: 0, width: 100, height: 100 },
    }) as MapDoc;
    // Simulate old save without scale
    const raw = JSON.stringify({ ...doc, background: { x: 0, y: 0, width: 100, height: 100 } });
    localStorage.setItem('mapEditor:doc', raw);
    const loaded = loadMap();
    expect(loaded?.background?.scale).toBe(1);
  });

  it('substitutes DEFAULT_MAP_BORDER when border is missing', () => {
    const raw = JSON.stringify({ name: 'X', zones: [], edges: [] });
    localStorage.setItem('mapEditor:doc', raw);
    const loaded = loadMap();
    expect(loaded?.border).toEqual(DEFAULT_MAP_BORDER);
  });

  it('substitutes DEFAULT_MAP_BORDER when border width is 0', () => {
    const raw = JSON.stringify({
      name: 'X',
      zones: [],
      edges: [],
      border: { x: 0, y: 0, width: 0, height: 100 },
    });
    localStorage.setItem('mapEditor:doc', raw);
    const loaded = loadMap();
    expect(loaded?.border).toEqual(DEFAULT_MAP_BORDER);
  });

  it('swallows quota-exceeded errors without throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => saveMap(makeDoc())).not.toThrow();
  });
});

// ─── saveBgImage / loadBgImage / clearBgImage ────────────────────────────────

describe('saveBgImage / loadBgImage / clearBgImage', () => {
  it('round-trips a Blob through IndexedDB', async () => {
    const blob = new Blob(['pixel data'], { type: 'image/png' });
    await saveBgImage(blob);
    const loaded = await loadBgImage();
    expect(loaded).not.toBeNull();
  });

  it('returns null when nothing is saved', async () => {
    expect(await loadBgImage()).toBeNull();
  });

  it('returns null after clearBgImage', async () => {
    await saveBgImage(new Blob(['data'], { type: 'image/png' }));
    await clearBgImage();
    expect(await loadBgImage()).toBeNull();
  });
});
