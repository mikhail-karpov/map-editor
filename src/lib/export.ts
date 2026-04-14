import type { ExportedMap, MapDoc } from '@/types/map';

export function exportMap(doc: MapDoc): void {
  // Strip editor-only fields (border) from the exported payload
  const { ...exportableDoc } = doc;
  const exported: ExportedMap = {
    version: 1,
    map: exportableDoc as MapDoc,
  };
  const json = JSON.stringify(exported, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.name || 'map'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export type ImportResult = { ok: true; doc: MapDoc } | { ok: false; error: string };

export function parseImport(raw: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Invalid file format.' };
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.version !== 1) {
    return {
      ok: false,
      error: `Unsupported file version: ${obj.version ?? 'missing'}. Expected version 1.`,
    };
  }

  const map = obj.map;
  if (!map || typeof map !== 'object') {
    return { ok: false, error: 'Missing "map" field.' };
  }

  const m = map as Record<string, unknown>;

  if (typeof m.name !== 'string') {
    return { ok: false, error: 'Map "name" must be a string.' };
  }

  if (!Array.isArray(m.zones)) {
    return { ok: false, error: 'Map "zones" must be an array.' };
  }

  for (const zone of m.zones) {
    if (
      !zone ||
      typeof zone !== 'object' ||
      typeof zone.id !== 'string' ||
      typeof zone.label !== 'string' ||
      typeof zone.x !== 'number' ||
      typeof zone.y !== 'number'
    ) {
      return { ok: false, error: 'One or more zones have invalid structure.' };
    }
  }

  if (!Array.isArray(m.edges)) {
    return { ok: false, error: 'Map "edges" must be an array.' };
  }

  for (const edge of m.edges) {
    if (
      !edge ||
      typeof edge !== 'object' ||
      typeof edge.id !== 'string' ||
      typeof edge.a !== 'string' ||
      typeof edge.b !== 'string'
    ) {
      return { ok: false, error: 'One or more edges have invalid structure.' };
    }
  }

  if (m.background !== undefined) {
    const bg = m.background;
    if (
      !bg ||
      typeof bg !== 'object' ||
      typeof (bg as Record<string, unknown>).x !== 'number' ||
      typeof (bg as Record<string, unknown>).y !== 'number' ||
      typeof (bg as Record<string, unknown>).width !== 'number' ||
      typeof (bg as Record<string, unknown>).height !== 'number'
    ) {
      return { ok: false, error: 'Background geometry has invalid structure.' };
    }
  }

  return {
    ok: true,
    doc: m as unknown as MapDoc,
  };
}
