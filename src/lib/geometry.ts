export type Point = { x: number; y: number };

export type Viewport = { tx: number; ty: number; scale: number };

/** Convert a screen point to world coords given viewport transform */
export function screenToWorld(sx: number, sy: number, vp: Viewport): Point {
  return {
    x: (sx - vp.tx) / vp.scale,
    y: (sy - vp.ty) / vp.scale,
  };
}

/** Compute new viewport after zooming by `factor` centred on screen point (cx,cy) */
export function zoomViewport(
  vp: Viewport,
  factor: number,
  cx: number,
  cy: number,
  minScale = 0.25,
  maxScale = 4
): Viewport {
  const newScale = Math.min(maxScale, Math.max(minScale, vp.scale * factor));
  // Keep world point under cursor invariant
  const tx = cx - (cx - vp.tx) * (newScale / vp.scale);
  const ty = cy - (cy - vp.ty) * (newScale / vp.scale);
  return { tx, ty, scale: newScale };
}
