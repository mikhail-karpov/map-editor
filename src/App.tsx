import { useState } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Canvas } from '@/components/Canvas/Canvas';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { Header } from '@/components/Header/Header';
import { Inspector } from '@/components/Inspector/Inspector';
import { useHydration } from '@/hooks/useHydration';
import { useAutosave } from '@/hooks/useAutosave';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMapStore } from '@/store/mapStore';
import type { BackgroundGeometry } from '@/types/map';

function App() {
  const [bgObjectUrl, setBgObjectUrl] = useState<string | null>(null);

  // Restore saved state on mount
  useHydration(setBgObjectUrl);

  // Debounced autosave on every doc change
  useAutosave();

  // Global keyboard shortcuts (V/Z/C/H/B/Delete/Esc/Ctrl+Z/Ctrl+Shift+Z)
  useKeyboardShortcuts();

  const setBackgroundGeometry = useMapStore((s) => s.setBackgroundGeometry);

  function handleBgAttached(url: string, geom: BackgroundGeometry) {
    // Revoke previous object URL to avoid memory leaks
    if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl);
    setBgObjectUrl(url);
    setBackgroundGeometry(geom);
  }

  function handleBgCleared() {
    if (bgObjectUrl) URL.revokeObjectURL(bgObjectUrl);
    setBgObjectUrl(null);
  }

  return (
    <TooltipProvider>
      {/* Full-screen canvas — everything else floats on top */}
      <Canvas bgObjectUrl={bgObjectUrl} />

      {/* Floating overlays */}
      <Header onBgCleared={handleBgCleared} />
      <Toolbar />
      <Inspector
        bgObjectUrl={bgObjectUrl}
        onBgAttached={handleBgAttached}
        onBgCleared={handleBgCleared}
      />
    </TooltipProvider>
  );
}

export default App;
