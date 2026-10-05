"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Normalised progress (0…1) through a tall scroll track whose stage is `position: sticky`.
 *
 * The value is always derived from the track's real layout position — never from an animation that is
 * assumed to have run — so hard loads, reloads mid-section, Back/Forward restores, resizes and font swaps
 * all land in the right state. `apply` writes the DOM directly (no React render per frame).
 *
 *  - before first paint (layout effect) and on resize, font load or reduced-motion change: snap;
 *  - every animation frame of the scene's render loop (`driver`): exponential follow with time constant
 *    `tau`, so wheel steps glide instead of stepping. The follow never trails the real position by more
 *    than `maxLag`, so a long jump (Home, back-to-top, fast fling) glides only its last stretch and the
 *    shown state is never more than one step away from where the page actually is;
 *  - on scroll while that loop is paused (scene off-screen, tab hidden): snap.
 */
export function useScrollTimeline<T extends HTMLElement>(
  apply: (p: number, reduced: boolean) => void,
  tau: number,
  maxLag = 0.15,
) {
  const trackRef = useRef<T>(null);
  const st = useRef({ p: 0, reduced: false, lastDrive: 0 });

  const measure = useCallback(() => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const range = rect.height - window.innerHeight;
    return range > 0 ? clamp01(-rect.top / range) : 0;
  }, []);

  useLayoutEffect(() => {
    const s = st.current;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let alive = true;
    const snap = () => {
      if (!alive) return;
      s.reduced = mq.matches;
      s.p = measure();
      apply(s.p, s.reduced);
    };
    const onScroll = () => {
      if (performance.now() - s.lastDrive > 120) snap();
    };
    snap();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", snap);
    mq.addEventListener("change", snap);
    void document.fonts?.ready.then(snap);
    return () => {
      alive = false;
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", snap);
      mq.removeEventListener("change", snap);
    };
  }, [apply, measure]);

  const driver = useCallback(
    (dt: number) => {
      const s = st.current;
      s.lastDrive = performance.now();
      const target = measure();
      if (s.reduced) s.p = target;
      else {
        s.p += (target - s.p) * (1 - Math.exp(-dt / tau));
        s.p = Math.min(target + maxLag, Math.max(target - maxLag, s.p));
        if (Math.abs(target - s.p) < 1e-4) s.p = target;
      }
      apply(s.p, s.reduced);
      return s.p;
    },
    [apply, measure, tau, maxLag],
  );

  return { trackRef, driver };
}
