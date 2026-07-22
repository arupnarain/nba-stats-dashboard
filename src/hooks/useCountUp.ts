"use client";

import { useEffect, useRef, useState } from "react";

interface Options {
  duration?: number;
  /** Respect the OS "reduce motion" setting by snapping straight to the value. */
  respectReducedMotion?: boolean;
}

/**
 * Animate a number from 0 up to `target` with an ease-out curve.
 * Used for headline stats (leader tiles, the detail modal) — not the 60-card
 * grid, to keep that render cheap.
 */
export function useCountUp(target: number, { duration = 750 }: Options = {}): number {
  const [value, setValue] = useState(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Reduced motion (or a zero target) => snap on the first frame instead of
    // animating. Every state update still happens inside rAF, never
    // synchronously in the effect body.
    const runFor = reduce ? 0 : duration;

    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const t = runFor === 0 ? 1 : Math.min(1, (now - start) / runFor);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setValue(target * eased);
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}
