import { get, set, del } from 'idb-keyval';
import type { MapDoc } from '@/types/map';
import { DEFAULT_MAP_BORDER } from '@/constants/mapBorder';

const MAP_KEY = 'mapEditor:doc';
const BG_IMAGE_KEY = 'mapEditor:bgImage';

// ── Map JSON via localStorage ──────────────────────────────────────────────

export function saveMap(doc: MapDoc): void {
  try {
    localStorage.setItem(MAP_KEY, JSON.stringify(doc));
  } catch {
    // quota exceeded or private browsing — silently ignore
  }
}

export function loadMap(): MapDoc | null {
  try {
    const raw = localStorage.getItem(MAP_KEY);
    if (!raw) return null;
    const doc = JSON.parse(raw) as MapDoc;
    // Backwards-compat: old saves lack scale; default to 1.0
    if (doc.background && doc.background.scale === undefined) {
      doc.background.scale = 1;
    }
    // Backwards-compat: old saves lack border; default to DEFAULT_MAP_BORDER
    if (
      !doc.border ||
      typeof doc.border.width !== 'number' ||
      doc.border.width <= 0 ||
      typeof doc.border.height !== 'number' ||
      doc.border.height <= 0
    ) {
      doc.border = DEFAULT_MAP_BORDER;
    }
    return doc;
  } catch {
    return null;
  }
}

// ── Background image via IndexedDB ─────────────────────────────────────────

export async function saveBgImage(blob: Blob): Promise<void> {
  await set(BG_IMAGE_KEY, blob);
}

export async function loadBgImage(): Promise<Blob | null> {
  const val = await get<Blob>(BG_IMAGE_KEY);
  return val ?? null;
}

export async function clearBgImage(): Promise<void> {
  await del(BG_IMAGE_KEY);
}
