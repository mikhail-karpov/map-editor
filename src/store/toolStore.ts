import { create } from 'zustand';

export type Tool = 'select' | 'addZone' | 'connect' | 'pan' | 'background';

type ToolState = {
  activeTool: Tool;
  connectSourceId: string | null;
};

type ToolActions = {
  setTool: (tool: Tool) => void;
  setConnectSource: (id: string | null) => void;
};

export type ToolStore = ToolState & ToolActions;

export const useToolStore = create<ToolStore>()((set) => ({
  activeTool: 'select',
  connectSourceId: null,

  setTool(tool) {
    set({ activeTool: tool, connectSourceId: null });
  },

  setConnectSource(id) {
    set({ connectSourceId: id });
  },
}));

export function useActiveTool() {
  return useToolStore((s) => s.activeTool);
}

export function useConnectSourceId() {
  return useToolStore((s) => s.connectSourceId);
}
