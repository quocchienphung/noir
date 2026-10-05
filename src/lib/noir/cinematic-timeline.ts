// Scroll state machine for the home page's black-hole frame (docs/research/noir/SCROLL_TIMELINE.md).
// Pure function of layout-derived progress: the same input always yields the same frame, whatever ran before.

export type CinematicState = "pre-enter" | "framed" | "expanding" | "statement" | "exit";

export interface CinematicFrame {
  state: CinematicState;
  /** Frame clip insets as fractions of the stage (each side). */
  insetX: number;
  insetY: number;
  /** Corner radius of the frame, px. */
  radius: number;
  /** Counter-scale of the scene inside the frame (zoom-out as the frame opens). */
  mediaScale: number;
  markOpacity: number;
  markScale: number;
  /** Per-line reveal 0…1 of the statement. */
  lines: number[];
  captionOpacity: number;
  /** Lift of the statement block while it leaves, in vh. */
  exitLift: number;
  /** Darkening of the scene during the exit, 0…1. */
  sceneFade: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const seg = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const CINEMATIC_MARKS = {
  framedEnd: 0.06,
  expandedAt: 0.42,
  statementEnd: 0.82,
} as const;

/**
 * @param q        progress through the pinned range (0 when the stage pins, 1 when it releases)
 * @param pinned   whether the track top has reached the viewport top (false → "pre-enter")
 * @param lineCount number of statement lines
 * @param narrow   phone layout (smaller frame insets)
 */
export function cinematicTimeline(q: number, pinned: boolean, lineCount: number, narrow: boolean): CinematicFrame {
  const p = pinned ? clamp01(q) : 0;
  const { framedEnd, expandedAt, statementEnd } = CINEMATIC_MARKS;
  const state: CinematicState = !pinned
    ? "pre-enter"
    : p < framedEnd
      ? "framed"
      : p < expandedAt
        ? "expanding"
        : p < statementEnd
          ? "statement"
          : "exit";

  const open = seg(framedEnd, expandedAt, p);
  const startX = narrow ? 0.05 : 0.17;
  const startY = narrow ? 0.17 : 0.17;
  // finishes well before release (q = 1) so the statement is gone before the stage scrolls away
  const leave = seg(statementEnd + 0.03, 0.93, p);

  const lines = Array.from({ length: lineCount }, (_, i) => {
    const a = expandedAt + 0.02 + i * 0.07;
    return seg(a, a + 0.14, p) * (1 - leave);
  });

  return {
    state,
    insetX: lerp(startX, 0, open),
    insetY: lerp(startY, 0, open),
    radius: lerp(narrow ? 10 : 14, 0, open),
    mediaScale: lerp(1.14, 1, open),
    markOpacity: 1 - seg(framedEnd + 0.04, expandedAt - 0.06, p),
    markScale: lerp(1, 1.6, seg(framedEnd, expandedAt, p)),
    lines,
    captionOpacity: seg(expandedAt + 0.2, expandedAt + 0.3, p) * (1 - leave),
    exitLift: -6 * leave,
    sceneFade: 0.6 * seg(statementEnd, 1, p),
  };
}
