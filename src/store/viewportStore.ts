import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { zoomViewport, type Viewport } from '@/lib/geometry';

type ViewportState = Viewport;

type ViewportActions = {
  pan: (dx: number, dy: number) => void;
  zoom: (factor: number, cx: number, cy: number) => void;
  setViewport: (vp: Viewport) => void;
};

export type ViewportStore = ViewportState & ViewportActions;

export const useViewportStore = create<ViewportStore>()((set) => ({
  tx: 0,
  ty: 0,
  scale: 1,

  pan(dx, dy) {
    set((s) => ({ tx: s.tx + dx, ty: s.ty + dy }));
  },

  zoom(factor, cx, cy) {
    set((s) => zoomViewport(s, factor, cx, cy));
  },

  setViewport(vp) {
    set(vp);
  },
}));

export function useViewport(): Viewport {
  return useViewportStore(useShallow((s) => ({ tx: s.tx, ty: s.ty, scale: s.scale })));
}
