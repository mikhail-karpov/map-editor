import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutosave } from './useAutosave';
import { useMapStore } from '@/store/mapStore';
import * as storage from '@/lib/storage';

vi.mock('@/lib/storage', () => ({
  saveMap: vi.fn(),
  loadMap: vi.fn(),
  saveBgImage: vi.fn(),
  loadBgImage: vi.fn(),
  clearBgImage: vi.fn(),
}));

const saveMap = vi.mocked(storage.saveMap);

const initialMap = useMapStore.getState();
beforeEach(() => {
  useMapStore.setState(initialMap, true);
  saveMap.mockClear();
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('useAutosave', () => {
  it('does not call saveMap before 1000ms', () => {
    renderHook(() => useAutosave());
    act(() => vi.advanceTimersByTime(999));
    expect(saveMap).not.toHaveBeenCalled();
  });

  it('calls saveMap once after 1000ms with current doc', () => {
    renderHook(() => useAutosave());
    act(() => vi.advanceTimersByTime(1000));
    expect(saveMap).toHaveBeenCalledOnce();
    expect(saveMap).toHaveBeenCalledWith(useMapStore.getState().doc);
  });

  it('resets the debounce when doc changes mid-window', () => {
    renderHook(() => useAutosave());
    act(() => vi.advanceTimersByTime(500));
    // mutate store — hook re-renders, cancels old timer, starts new 1000ms window
    act(() => {
      useMapStore.getState().createZone(0, 0);
    });
    act(() => vi.advanceTimersByTime(999));
    expect(saveMap).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(saveMap).toHaveBeenCalledOnce();
  });

  it('clears the pending timer on unmount', () => {
    const { unmount } = renderHook(() => useAutosave());
    act(() => vi.advanceTimersByTime(500));
    unmount();
    act(() => vi.advanceTimersByTime(1000));
    expect(saveMap).not.toHaveBeenCalled();
  });
});
