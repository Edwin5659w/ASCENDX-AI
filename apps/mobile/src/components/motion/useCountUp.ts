import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Anima un número desde su valor anterior (0 la primera vez) hasta `target`.
 * Se usa para que montos y porcentajes «cuenten» al aparecer o cambiar.
 * Con «reducir movimiento» devuelve el valor final de inmediato.
 */
export function useCountUp(target: number, { duration = 900, delay = 0 }: { duration?: number; delay?: number } = {}) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);
  const currentRef = useRef(value);

  useEffect(() => {
    if (reduced || !Number.isFinite(target)) {
      currentRef.current = target;
      return;
    }
    const from = currentRef.current;
    let frame = 0;
    let start: number | null = null;
    const timer = setTimeout(() => {
      const step = (now: number) => {
        if (start === null) start = now;
        const t = Math.min(1, (now - start) / duration);
        const next = from + (target - from) * easeOutCubic(t);
        currentRef.current = next;
        setValue(next);
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [target, duration, delay, reduced]);

  return reduced || !Number.isFinite(target) ? target : value;
}
