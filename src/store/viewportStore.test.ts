import { describe, it, expect, beforeEach } from 'vitest';
import { useViewportStore } from './viewportStore';
import { screenToWorld } from '@/lib/geometry';

const initialViewport = useViewportStore.getState();
beforeEach(() => useViewportStore.setState(initialViewport, true));

describe('pan', () => {
  it('adds dx/dy to tx/ty', () => {
    useViewportStore.getState().pan(30, -20);
    const { tx, ty } = useViewportStore.getState();
    expect(tx).toBe(initialViewport.tx + 30);
    expect(ty).toBe(initialViewport.ty - 20);
  });
});

describe('zoom', () => {
  it('clamps resulting scale within bounds', () => {
    useViewportStore.setState({ tx: 0, ty: 0, scale: 3.9 });
    useViewportStore.getState().zoom(2, 0, 0);
    expect(useViewportStore.getState().scale).toBe(4);
  });

  it('preserves the world point under cursor', () => {
    useViewportStore.setState({ tx: 0, ty: 0, scale: 1 });
    const cx = 300;
    const cy = 200;
    const before = useViewportStore.getState();
    const worldBefore = screenToWorld(cx, cy, before);
    useViewportStore.getState().zoom(1.5, cx, cy);
    const after = useViewportStore.getState();
    const worldAfter = screenToWorld(cx, cy, after);
    expect(worldAfter.x).toBeCloseTo(worldBefore.x);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y);
  });
});

describe('setZoom', () => {
  it('reaches the requested scale at the given centre', () => {
    useViewportStore.setState({ tx: 0, ty: 0, scale: 1 });
    const cx = 200;
    const cy = 150;
    const worldBefore = screenToWorld(cx, cy, useViewportStore.getState());
    useViewportStore.getState().setZoom(2, cx, cy);
    const after = useViewportStore.getState();
    expect(after.scale).toBe(2);
    const worldAfter = screenToWorld(cx, cy, after);
    expect(worldAfter.x).toBeCloseTo(worldBefore.x);
    expect(worldAfter.y).toBeCloseTo(worldBefore.y);
  });
});

describe('setViewport', () => {
  it('replaces all three fields atomically', () => {
    useViewportStore.getState().setViewport({ tx: 100, ty: 200, scale: 1.5 });
    expect(useViewportStore.getState()).toMatchObject({ tx: 100, ty: 200, scale: 1.5 });
  });
});
