import { describe, it, expect } from 'vitest';
import { screenToWorld, zoomViewport } from './geometry';

describe('screenToWorld', () => {
  it('returns input point unchanged for identity viewport', () => {
    const result = screenToWorld(100, 200, { tx: 0, ty: 0, scale: 1 });
    expect(result).toEqual({ x: 100, y: 200 });
  });

  it('accounts for translation', () => {
    const result = screenToWorld(100, 100, { tx: 50, ty: 50, scale: 1 });
    expect(result).toEqual({ x: 50, y: 50 });
  });

  it('accounts for scale', () => {
    const result = screenToWorld(100, 100, { tx: 0, ty: 0, scale: 2 });
    expect(result).toEqual({ x: 50, y: 50 });
  });
});

describe('zoomViewport', () => {
  it('clamps to maxScale when factor would exceed it', () => {
    const vp = { tx: 0, ty: 0, scale: 3.9 };
    const result = zoomViewport(vp, 2, 0, 0);
    expect(result.scale).toBe(4);
  });

  it('clamps to minScale when factor would go below it', () => {
    const vp = { tx: 0, ty: 0, scale: 0.3 };
    const result = zoomViewport(vp, 0.5, 0, 0);
    expect(result.scale).toBe(0.25);
  });

  it('preserves the world point under cursor after zoom', () => {
    const vp = { tx: 0, ty: 0, scale: 1 };
    const cx = 200;
    const cy = 150;
    const worldBefore = screenToWorld(cx, cy, vp);
    const result = zoomViewport(vp, 1.5, cx, cy);
    const worldAfter = screenToWorld(cx, cy, result);
    expect(worldAfter.x).toBeCloseTo(worldBefore.x);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y);
  });

  it('respects custom min/max overrides', () => {
    const vp = { tx: 0, ty: 0, scale: 1 };
    const clamped = zoomViewport(vp, 10, 0, 0, 0.1, 2);
    expect(clamped.scale).toBe(2);

    const clampedMin = zoomViewport(vp, 0.01, 0, 0, 0.5, 4);
    expect(clampedMin.scale).toBe(0.5);
  });
});
