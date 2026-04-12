import { useEffect, useRef } from 'react';
import { useMapStore } from '@/store/mapStore';
import { loadMap, loadBgImage } from '@/lib/storage';

/**
 * On mount, loads saved map from localStorage and background image from
 * IndexedDB, restoring the full editing session.
 *
 * Returns a ref to the current background object URL so canvas can use it.
 */
export function useHydration(setBgObjectUrl: (url: string | null) => void) {
  const replaceDoc = useMapStore((s) => s.replaceDoc);
  const setBackgroundGeometry = useMapStore((s) => s.setBackgroundGeometry);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const savedDoc = loadMap();
    if (savedDoc) {
      const { background, ...rest } = savedDoc;
      replaceDoc(rest);

      if (background) {
        setBackgroundGeometry(background);
        // Restore image from IndexedDB
        loadBgImage().then((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            setBgObjectUrl(url);
          }
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
