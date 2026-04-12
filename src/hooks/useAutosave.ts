import { useEffect, useRef } from 'react';
import { useMapStore } from '@/store/mapStore';
import { saveMap } from '@/lib/storage';

const DEBOUNCE_MS = 1000;

export function useAutosave() {
  const doc = useMapStore((s) => s.doc);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveMap(doc);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [doc]);
}
