// NOIR sitewide motion: one typed source for every route transition, page entrance and viewport reveal.
//
// Provenance (Aithor's public route config and About appear config, as recorded in the motion task's research
// notes — docs/research/sitewide-motion; reference material is never imported at runtime):
//   CONFIGURED in Aithor (copied):  route exit 600 ms tween [0.4, 0, 0.24, 1] → opacity 0
//                                   route enter 600 ms tween [0.68, 0, 0.33, 1], delay 300 ms, opacity 0 → 1
//                                   About appear delays: eyebrow 300, visual 400, heading 500, lead 900,
//                                   buttons 1000 ms; spring bounce 0, duration 1.5 s; heading blur 10 px + y 10 px,
//                                   visual y 30 px, pills y 16 px (pills not used: NOIR has none)
//   ADAPTED for NOIR (decisions, not Aithor facts): no page-level scale (sticky scenes, WebGL, fixed header);
//                                   viewport reveals below the fold 800 ms, y 14 px, 80 ms stagger capped per batch;
//                                   above-the-fold content blocks after the lead at 1100 ms + 90 ms stagger; the
//                                   spring is approximated by a sampled critically damped curve (CSS linear()).

export type MotionRole = "eyebrow" | "heading" | "lead" | "actions" | "visual" | "block" | "item" | "legal";

export interface RoleMotion {
  /** Delay from route-ready (ms) when the element is in view at that moment. */
  delay: number;
  duration: number;
  /** Start offsets (px); final state is always the element's own CSS (opacity 1, no transform/filter). */
  y: number;
  blur: number;
}

export const ROUTE = {
  exit: { duration: 600, easing: "cubic-bezier(0.4, 0, 0.24, 1)" },
  enter: { duration: 600, delay: 300, easing: "cubic-bezier(0.68, 0, 0.33, 1)" },
  /** Fail-safe only: if a navigation has not committed by then, the current page is shown again. */
  commitTimeout: 8000,
} as const;

/** Entrance choreography on route-ready (configured Aithor delays where a role exists; adapted otherwise). */
export const ROLES: Record<MotionRole, RoleMotion> = {
  eyebrow: { delay: 300, duration: 1500, y: 0, blur: 0 },
  visual: { delay: 400, duration: 1500, y: 30, blur: 0 },
  heading: { delay: 500, duration: 1500, y: 10, blur: 10 },
  lead: { delay: 900, duration: 1500, y: 0, blur: 0 },
  actions: { delay: 1000, duration: 1500, y: 0, blur: 0 },
  // adapted: above-the-fold blocks that follow the lead (cards, form, sections already in view)
  block: { delay: 1100, duration: 1500, y: 14, blur: 0 },
  item: { delay: 1100, duration: 1500, y: 14, blur: 0 },
  // legal sections: quick and plain, reading first
  legal: { delay: 700, duration: 900, y: 8, blur: 0 },
};

/** Viewport reveal for content that enters later (adapted, not measured on Aithor). */
export const REVEAL = {
  duration: 800,
  y: 14,
  stagger: 80,
  /** Items revealed in one batch beyond this index share the last delay (no multi-second waits). */
  maxSteps: 5,
  /** Above-the-fold group stagger at route-ready. */
  entranceStagger: 90,
  /** Reveal as soon as a target touches the viewport: a negative margin left the last rows of a page (footer
   *  bottom) outside the trigger zone at the end of the scroll. */
  rootMargin: "0px",
} as const;

/**
 * Spring with bounce 0 and duration T (Framer's duration-based spring) approximated by a critically damped
 * oscillator x(t) = 1 − (1 + ωt)·e^(−ωt) with ωT = 8 (within 0.3 % of rest at T), sampled into CSS linear().
 * An approximation, not Framer's solver: compared by playback, not claimed identical.
 */
function springLinear(samples = 28, wT = 8): string {
  const pts: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const x = i === samples ? 1 : 1 - (1 + wT * t) * Math.exp(-wT * t);
    pts.push(x.toFixed(4));
  }
  return `linear(${pts.join(", ")})`;
}

export const SPRING_EASE = springLinear();
/** Used where linear() is unsupported (older engines): a strong ease-out of similar shape. */
export const SPRING_FALLBACK = "cubic-bezier(0.16, 1, 0.3, 1)";
export const REVEAL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
