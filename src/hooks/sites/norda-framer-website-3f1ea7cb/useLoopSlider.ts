"use client";

import { useCallback, useRef, useState, type PointerEvent } from "react";
import { prefersReducedMotion } from "@/lib/sites/norda-framer-website-3f1ea7cb/scroll";

/**
 * Infinite one-slide-at-a-time slider state shared by the hero and testimonials.
 * The track renders [last clone, ...slides, first clone]; `pos` 1..count are real slides.
 * Landing on a clone jumps without animation to the slide it mirrors (seamless loop, MEASURED on source).
 */
export function useLoopSlider(count: number) {
  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);
  const drag = useRef<{ x: number; id: number } | null>(null);
  const active = (((pos - 1) % count) + count) % count;

  const go = useCallback(
    (delta: number) => {
      const reduced = prefersReducedMotion();
      setAnimate(!reduced);
      setPos((p) => {
        const next = Math.max(0, Math.min(count + 1, p + delta));
        if (reduced) return next === 0 ? count : next === count + 1 ? 1 : next;
        return next;
      });
    },
    [count],
  );

  const onTransitionEnd = useCallback(() => {
    setPos((p) => {
      if (p === 0 || p === count + 1) {
        setAnimate(false);
        return p === 0 ? count : 1;
      }
      return p;
    });
  }, [count]);

  const dragHandlers = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse") return;
      drag.current = { x: e.clientX, id: e.pointerId };
    },
    onPointerUp: (e: PointerEvent<HTMLElement>) => {
      const d = drag.current;
      drag.current = null;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x;
      if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    },
    onPointerCancel: () => {
      drag.current = null;
    },
  };

  return { pos, animate, active, go, onTransitionEnd, dragHandlers };
}

/** Builds the cloned track for useLoopSlider. */
export function loopTrack<T>(items: T[]): T[] {
  return [items[items.length - 1], ...items, items[0]];
}
