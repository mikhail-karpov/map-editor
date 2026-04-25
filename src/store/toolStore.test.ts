import { describe, it, expect, beforeEach } from 'vitest';
import { useToolStore } from './toolStore';

const initialTool = useToolStore.getState();
beforeEach(() => useToolStore.setState(initialTool, true));

describe('default state', () => {
  it('has activeTool select and no connect source', () => {
    const { activeTool, connectSourceId } = useToolStore.getState();
    expect(activeTool).toBe('select');
    expect(connectSourceId).toBeNull();
  });
});

describe('setTool', () => {
  it('sets the active tool', () => {
    useToolStore.getState().setTool('connect');
    expect(useToolStore.getState().activeTool).toBe('connect');
  });

  it('clears connectSourceId when switching away from connect', () => {
    useToolStore.getState().setConnectSource('zone-1');
    expect(useToolStore.getState().connectSourceId).toBe('zone-1');
    useToolStore.getState().setTool('select');
    expect(useToolStore.getState().connectSourceId).toBeNull();
  });
});

describe('setConnectSource', () => {
  it('stores the given id', () => {
    useToolStore.getState().setConnectSource('zone-42');
    expect(useToolStore.getState().connectSourceId).toBe('zone-42');
  });
});
