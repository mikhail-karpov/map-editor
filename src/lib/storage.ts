import { get, set, del } from 'idb-keyval';
import type { MapDoc } from '@/types/map';

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
    return JSON.parse(raw) as MapDoc;
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
