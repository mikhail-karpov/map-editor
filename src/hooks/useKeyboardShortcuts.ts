import { useEffect } from 'react';
import { useMapStore } from '@/store/mapStore';
import { useToolStore } from '@/store/toolStore';

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable;
}

/**
 * Global keyboard shortcuts per spec §6.8.
 * All tool-switching shortcuts early-return when an input is focused so
 * typing a label doesn't accidentally switch tools.
 */
export function useKeyboardShortcuts() {
  const { undo, redo, deleteZone, deleteEdge, select } = useMapStore();
  const { setTool, setConnectSource } = useToolStore();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;

      // Undo / Redo — always handled even in inputs (matches browser convention)
      if (meta && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        redo();
        return;
      }
      if (meta && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }

      // Everything else respects input focus
      if (isInputFocused()) return;

      switch (e.key) {
        case 'v':
        case 'V':
          e.preventDefault();
          setTool('select');
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          setTool('addZone');
          break;
        case 'c':
        case 'C':
          e.preventDefault();
          setTool('connect');
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          setTool('pan');
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          setTool('background');
          break;

        case 'Delete':
        case 'Backspace': {
          e.preventDefault();
          const sel = useMapStore.getState().selection;
          if (sel.kind === 'zone') {
            deleteZone(sel.id);
          } else if (sel.kind === 'edge') {
            deleteEdge(sel.id);
          }
          break;
        }

        case 'Escape':
          e.preventDefault();
          // Cancel in-progress connect
          setConnectSource(null);
          // Deselect
          select({ kind: 'none' });
          break;
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo, deleteZone, deleteEdge, select, setTool, setConnectSource]);
}
