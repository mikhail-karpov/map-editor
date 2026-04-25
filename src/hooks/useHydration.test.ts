import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHydration } from './useHydration';
import { useMapStore } from '@/store/mapStore';
import * as storage from '@/lib/storage';
import { makeDoc } from '@/test/fixtures';

vi.mock('@/lib/storage', () => ({
  saveMap: vi.fn(),
  loadMap: vi.fn(),
  loadBgImage: vi.fn(),
  saveBgImage: vi.fn(),
  clearBgImage: vi.fn(),
}));

const loadMap = vi.mocked(storage.loadMap);
const loadBgImage = vi.mocked(storage.loadBgImage);

const initialMap = useMapStore.getState();
beforeEach(() => {
  useMapStore.setState(initialMap, true);
  vi.clearAllMocks();
  vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:test'), revokeObjectURL: vi.fn() });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useHydration', () => {
  it('does nothing when loadMap returns null', () => {
    loadMap.mockReturnValue(null);
    const setBgObjectUrl = vi.fn();
    renderHook(() => useHydration(setBgObjectUrl));
    expect(useMapStore.getState().doc.name).toBe('My Map');
    expect(setBgObjectUrl).not.toHaveBeenCalled();
  });

  it('calls replaceDoc when loadMap returns a doc without background', () => {
    loadMap.mockReturnValue(makeDoc({ name: 'Loaded' }));
    const setBgObjectUrl = vi.fn();
    renderHook(() => useHydration(setBgObjectUrl));
    expect(useMapStore.getState().doc.name).toBe('Loaded');
    expect(useMapStore.getState().doc.background).toBeUndefined();
    expect(setBgObjectUrl).not.toHaveBeenCalled();
  });

  it('strips background from replaceDoc, sets geometry, and calls setBgObjectUrl when blob present', async () => {
    const background = { x: 0, y: 0, width: 800, height: 600 };
    loadMap.mockReturnValue(makeDoc({ name: 'WithBg', background }));
    loadBgImage.mockResolvedValue(new Blob(['data']));
    const setBgObjectUrl = vi.fn();

    renderHook(() => useHydration(setBgObjectUrl));

    // Synchronous effects: replaceDoc and setBackgroundGeometry already ran
    expect(useMapStore.getState().doc.name).toBe('WithBg');
    expect(useMapStore.getState().doc.background).toEqual(background);

    // Async: loadBgImage().then → setBgObjectUrl
    await waitFor(() => {
      expect(setBgObjectUrl).toHaveBeenCalledWith('blob:test');
    });
  });

  it('does not call setBgObjectUrl when loadBgImage resolves to null', async () => {
    const background = { x: 0, y: 0, width: 800, height: 600 };
    loadMap.mockReturnValue(makeDoc({ name: 'WithBg', background }));
    loadBgImage.mockResolvedValue(null);
    const setBgObjectUrl = vi.fn();

    renderHook(() => useHydration(setBgObjectUrl));

    await waitFor(() => expect(loadBgImage).toHaveBeenCalled());
    expect(setBgObjectUrl).not.toHaveBeenCalled();
  });

  it('does not re-run hydration on re-render', () => {
    loadMap.mockReturnValue(null);
    const setBgObjectUrl = vi.fn();
    const { rerender } = renderHook(() => useHydration(setBgObjectUrl));
    rerender();
    rerender();
    expect(loadMap).toHaveBeenCalledOnce();
  });
});
