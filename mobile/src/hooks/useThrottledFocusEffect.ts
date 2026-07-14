import { useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Como useFocusEffect, pero no vuelve a ejecutar si el tab ya refrescó
 * hace menos de `minIntervalMs` (excepto la primera vez).
 */
export function useThrottledFocusEffect(effect: () => void | (() => void), minIntervalMs = 25_000) {
  const lastRun = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastRun.current < minIntervalMs && lastRun.current !== 0) {
        return;
      }
      lastRun.current = now;
      return effect();
    }, [effect, minIntervalMs]),
  );
}
