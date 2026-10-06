// Scroll geometry of the Cards Almanac stack: a pure function of measured layout, so the same scroll position
// always settles on the same frame (forward, backward, reload, Home/End, scrollbar drag).
//
// Layout model (CSS, cards-almanac.module.css): every card's <li> is `position: sticky` with
// top = T + min(i, CAP) · band, so native scrolling carries each card up until it pins one band below the
// previous one. This module adds what CSS cannot derive: how far each incoming card has travelled, and from that
// the recession of the cards it covers, its lean, its cover zoom and its copy fade. Cards are drawn at a time-smoothed
// position (`visual`, eased toward the layout by the controller), so they glide after each wheel step and ease into
// their pin; at rest `visual` equals the layout and the frame is the deterministic one.
//
// Values are tuned estimates from raster frames of the public GetLayers preview (1920×1366; see
// docs/research/cards-almanac/implementation/REPORT.md), NOT extracted source constants:
//   scale step 0.036 per covered layer   (card widths 1468 → 1414 → 1362 → 1310 encoded px)
//   band ≈ 3.55 % of card width          (52 encoded px between stacked top edges)
//   lean ≈ 6.5° at entry → 0° settled    (incoming bottom edge ≈ 2.5 % wider than its top at mid-entry)
//   copy fades in late (≈ 50 % at 0.65 of the approach, near 0 at 0.35)

export const STACK = {
  /** Back layers that keep a visible band; older ones tuck under the oldest band (same top, smaller: occluded). */
  cap: 4,
  scaleStep: 0.036,
  /** Degrees of rotateX at the start of the approach (bottom edge toward the viewer, origin top centre). */
  lean: 6.5,
  /** Cover enlarges 1 → 1 + zoom inside its clipped frame while the card settles. */
  zoom: 0.06,
  shadeStep: 0.03,
  shadeMax: 0.12,
  /** Copy opacity ramps over this part of the approach. */
  fadeFrom: 0.3,
  fadeTo: 0.95,
  /** A covered card starts receding once the incoming card is this far into its approach. */
  depthFrom: 0.15,
} as const;

export interface CardMeasure {
  /** Distance (px) the card's top still has to travel to its pinned position (≤ 0 once pinned or releasing). */
  remaining: number;
  /**
   * Where the card is drawn instead (px, same frame as `remaining`): a time-smoothed copy of it, so cards glide
   * after each scroll step and ease into their pin. Omitted → drawn exactly at the layout position.
   */
  visual?: number;
  /** Length (px) of the approach: from the viewport's bottom edge to the pinned position. */
  range: number;
}

export interface CardFrame {
  /** 0 → just entering at the bottom of the viewport, 1 → pinned. */
  progress: number;
  /** Covered layers (continuous): Σ of the eased progress of every later card. */
  depth: number;
  translateY: number;
  scale: number;
  rotateX: number;
  coverScale: number;
  copyOpacity: number;
  shade: number;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Frames for every card from measured layout. `band` is the stacked top-edge spacing (px). */
export function stackFrames(cards: readonly CardMeasure[], band: number, out: CardFrame[] = []): CardFrame[] {
  const n = cards.length;
  out.length = n;
  const vis = cards.map((c) => c.visual ?? c.remaining);
  const progress = cards.map((c, i) => (c.range > 0 ? clamp01(1 - vis[i] / c.range) : 1));
  // depth of card j = Σ over later cards of their eased progress (suffix sums)
  let suffix = 0;
  const depth = new Array<number>(n);
  for (let j = n - 1; j >= 0; j--) {
    depth[j] = suffix;
    suffix += smoothstep(STACK.depthFrom, 1, progress[j]);
  }
  // release: sticky lets the front card (largest pinned top) leave first while the back cards stay pinned, which
  // would slide it over their bands; instead every card follows the front card's release offset (≤ 0)
  const release = n ? Math.min(0, vis[n - 1]) : 0;
  for (let j = 0; j < n; j++) {
    const e = progress[j];
    const c = depth[j];
    const slot = Math.min(j, STACK.cap);
    // beyond `cap` back layers: shift up into the oldest band's slot, where the (wider) card holding that band
    // covers them completely — long lists stay compact, and nothing is left focusable-but-transparent
    const excess = Math.max(0, c - (STACK.cap - slot));
    const incoming = j > 0;
    out[j] = {
      progress: e,
      depth: c,
      // drawn offset from the pin (approach, or the shared release) minus where layout already put the card
      translateY: -Math.min(excess, slot) * band + (j < n - 1 ? Math.max(0, vis[j]) + release : vis[j]) - cards[j].remaining,
      scale: 1 - STACK.scaleStep * Math.min(c, STACK.cap + 1),
      rotateX: incoming ? -STACK.lean * (1 - e) : 0,
      coverScale: 1 + STACK.zoom * smoothstep(0, 1, e),
      copyOpacity: incoming ? smoothstep(STACK.fadeFrom, STACK.fadeTo, e) : 1,
      shade: Math.min(STACK.shadeMax, STACK.shadeStep * c),
    };
  }
  return out;
}
