import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { useMapStore } from '@/store/mapStore';
import { useToolStore } from '@/store/toolStore';

vi.mock('@/lib/storage', () => ({
  saveMap: vi.fn(),
  loadMap: vi.fn(),
  loadBgImage: vi.fn(),
  saveBgImage: vi.fn(),
  clearBgImage: vi.fn(),
}));

function press(key: string, opts?: KeyboardEventInit) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...opts }));
}

const initialMap = useMapStore.getState();
const initialTool = useToolStore.getState();
beforeEach(() => {
  useMapStore.setState(initialMap, true);
  useToolStore.setState(initialTool, true);
});

// ─── Tool-switch keys ─────────────────────────────────────────────────────────

describe('tool switch shortcuts', () => {
  it('v → select', () => {
    useToolStore.getState().setTool('connect');
    renderHook(() => useKeyboardShortcuts());
    press('v');
    expect(useToolStore.getState().activeTool).toBe('select');
  });

  it('z → addZone (no meta)', () => {
    renderHook(() => useKeyboardShortcuts());
    press('z'); // no metaKey — must not trigger undo
    expect(useToolStore.getState().activeTool).toBe('addZone');
  });

  it('c → connect', () => {
    renderHook(() => useKeyboardShortcuts());
    press('c');
    expect(useToolStore.getState().activeTool).toBe('connect');
  });

  it('h → pan', () => {
    renderHook(() => useKeyboardShortcuts());
    press('h');
    expect(useToolStore.getState().activeTool).toBe('pan');
  });

  it('b → background', () => {
    renderHook(() => useKeyboardShortcuts());
    press('b');
    expect(useToolStore.getState().activeTool).toBe('background');
  });

  it('e → adjustBorder', () => {
    renderHook(() => useKeyboardShortcuts());
    press('e');
    expect(useToolStore.getState().activeTool).toBe('adjustBorder');
  });

  it('V (uppercase) → select', () => {
    useToolStore.getState().setTool('connect');
    renderHook(() => useKeyboardShortcuts());
    press('V');
    expect(useToolStore.getState().activeTool).toBe('select');
  });
});

// ─── Input focus guard ────────────────────────────────────────────────────────

describe('input focus', () => {
  afterEach(() => {
    document.querySelectorAll('input').forEach((el) => el.remove());
  });

  it('does not switch tool when an input is focused', () => {
    useToolStore.getState().setTool('connect');
    renderHook(() => useKeyboardShortcuts());
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    press('v');
    expect(useToolStore.getState().activeTool).toBe('connect');
  });

  it('Cmd+Z still triggers undo when an input is focused', () => {
    useMapStore.getState().createZone(0, 0);
    expect(useMapStore.getState().past).toHaveLength(1);
    renderHook(() => useKeyboardShortcuts());
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    press('z', { metaKey: true });
    expect(useMapStore.getState().past).toHaveLength(0);
  });
});

// ─── Undo / Redo ──────────────────────────────────────────────────────────────

describe('undo / redo', () => {
  it('Cmd+Z calls undo', () => {
    useMapStore.getState().createZone(0, 0);
    renderHook(() => useKeyboardShortcuts());
    press('z', { metaKey: true });
    expect(useMapStore.getState().doc.zones).toHaveLength(0);
  });

  it('Ctrl+Z also calls undo (cross-platform)', () => {
    useMapStore.getState().createZone(0, 0);
    renderHook(() => useKeyboardShortcuts());
    press('z', { ctrlKey: true });
    expect(useMapStore.getState().doc.zones).toHaveLength(0);
  });

  it('Cmd+Shift+Z calls redo', () => {
    useMapStore.getState().createZone(0, 0);
    useMapStore.getState().undo();
    expect(useMapStore.getState().future).toHaveLength(1);
    renderHook(() => useKeyboardShortcuts());
    press('Z', { metaKey: true, shiftKey: true });
    expect(useMapStore.getState().future).toHaveLength(0);
    expect(useMapStore.getState().doc.zones).toHaveLength(1);
  });
});

// ─── Delete / Backspace ───────────────────────────────────────────────────────

describe('delete / backspace', () => {
  it('Delete removes the selected zone', () => {
    const id = useMapStore.getState().createZone(0, 0);
    useMapStore.getState().select({ kind: 'zone', id });
    renderHook(() => useKeyboardShortcuts());
    press('Delete');
    expect(useMapStore.getState().doc.zones).toHaveLength(0);
  });

  it('Backspace removes the selected edge', () => {
    useMapStore.getState().createEdge('za', 'zb');
    const edgeId = useMapStore.getState().doc.edges[0].id;
    useMapStore.getState().select({ kind: 'edge', id: edgeId });
    renderHook(() => useKeyboardShortcuts());
    press('Backspace');
    expect(useMapStore.getState().doc.edges).toHaveLength(0);
  });

  it('Delete is a no-op when selection is none', () => {
    renderHook(() => useKeyboardShortcuts());
    press('Delete');
    expect(useMapStore.getState().doc.zones).toHaveLength(0);
    expect(useMapStore.getState().doc.edges).toHaveLength(0);
  });
});

// ─── Escape ───────────────────────────────────────────────────────────────────

describe('Escape', () => {
  it('clears connectSourceId and selection', () => {
    useToolStore.getState().setConnectSource('zone-1');
    useMapStore.getState().select({ kind: 'zone', id: 'zone-1' });
    renderHook(() => useKeyboardShortcuts());
    press('Escape');
    expect(useToolStore.getState().connectSourceId).toBeNull();
    expect(useMapStore.getState().selection).toEqual({ kind: 'none' });
  });
});

// ─── Unmount cleanup ──────────────────────────────────────────────────────────

describe('unmount', () => {
  it('removes the keydown listener on unmount', () => {
    useToolStore.getState().setTool('connect');
    const { unmount } = renderHook(() => useKeyboardShortcuts());
    unmount();
    press('v'); // listener is gone — tool stays at 'connect'
    expect(useToolStore.getState().activeTool).toBe('connect');
  });
});
