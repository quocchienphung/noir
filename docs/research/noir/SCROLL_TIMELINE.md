# NOIR scroll timelines

Both scroll scenes use `useScrollTimeline` (`src/components/noir/useScrollTimeline.ts`):

- **Progress** `p = clamp(−trackTop / (trackHeight − innerHeight))` is read from layout. It is never
  inferred from an animation that is assumed to have run.
- **Snap** (no smoothing) before first paint (layout effect), on resize, `document.fonts.ready`, and
  reduced-motion change. It also snaps on scroll while the render loop is paused (scene off-screen or
  tab hidden).
- **Follow** on each frame of the scene's render loop: `p += (target − p)(1 − e^(−dt/τ))`, clamped so
  `|p − target| ≤ maxLag`. Wheel steps glide. Long jumps (Home key, back to top, a fast fling) glide
  only their last stretch, so the state is never more than one step from the real position.
- DOM writes go straight to element styles from the loop (no React render per frame). The canvas
  receives the same `p`.

## Intro dive: `NoirIntro` (track 320svh, sticky 100svh stage)

τ = 0.12 s, maxLag = 0.2. `seg(a, b)` is a smoothstep from a to b.

| p | Event |
| --- | --- |
| 0 | Scene framed at r = 20 rs, camera 6.5° above the disk plane. Headline, lead, CTAs, gauge and cue are visible. |
| 0 → 0.07 | Scroll cue fades out. |
| 0 → 0.16 | Lead + CTAs blur (0 → 8 px), lift and fade. Above 0.6 of that fade they get `visibility: hidden`, so they are neither focusable nor clickable. |
| 0 → 0.30 | Headline lines stretch (scaleX 1 → 1.35, scaleY 1 → 0.7), blur 0 → 14 px and drift apart ±6vh. Opacity follows `seg(0.05, 0.3)`. The legibility scrim fades with them. |
| 0.18 → 0.82 | Camera "near" phase: elevation 6.5° → 3.9°, pitch-up 0 → 14°, roll −2.5° → −13.5°. The disk sinks diagonally. |
| 0.25 → 0.95 | FOV 52° → 64°. |
| 0.60 → 0.95 | Extra pitch-up of 10°, so the camera looks past the shadow's edge into darkness. |
| 0 → 1 | Gauge `r = 20^(1−p)` rs (20.00 → 1.00), riding the ruler from top to bottom. It fades over 0.9 → 0.99. |
| 0.84 → 0.985 | Frame fades to black (the horizon crossing). |
| 0.80 → 0.99 | Statement fades in: blur 16 → 0 px, scale 0.94 → 1. It is visibility-hidden below 0.4. |

Pointer: ±4° azimuth and ±1.6° elevation parallax, smoothed with τ = 0.35 s and reduced as p grows.
Fine pointers only. Time: Keplerian disk flow, ω = 1.25·r^−1.5, plus a slow 0.6° sway.

## Cinematic frame: `NoirCinematic` (track 300svh, sticky 100svh stage)

τ = 0.09 s, maxLag = 0.12. Pure state machine in `src/lib/noir/cinematic-timeline.ts`.

| State | q range | Frame (clip-path inset) | Scene | Mark | Statement |
| --- | --- | --- | --- | --- | --- |
| `pre-enter` | track top below viewport top | 17% / 17% (phone 17% / 5%), radius 14 px | scale 1.14, hole centred behind the mark | 1 | hidden |
| `framed` | 0 → 0.06 | same as pre-enter | same | 1 | hidden |
| `expanding` | 0.06 → 0.42 | insets → 0, radius → 0 | scale 1.14 → 1; aim drifts so the hole settles right of centre | fades over 0.10 → 0.36, scales 1 → 1.6 | hidden |
| `statement` | 0.42 → 0.82 | full | push-in d 21 → 15.5 rs | 0 | line *i* reveals over `0.44 + 0.07i → 0.58 + 0.07i`; caption over 0.62 → 0.72; scrim follows line 1 |
| `exit` | 0.82 → 1 | full | darkens 0 → 0.6 | 0 | lines and caption fade over 0.85 → 0.93 and lift 6vh |

After q = 1 the sticky stage releases and the next section (Services) scrolls over it.

Invariants (asserted per frame by `tests/qa-scroll.mjs`):

- Canvas, mark and statement are children of the one clipped frame, so nothing can paint outside it.
- The statement box sits inside the gutters, above `clamp(2rem, 9vh, 6rem)` from the bottom. Its
  `max-height` keeps it below the header.
- The CSS defaults **are** the framed state: `clip-path: inset(17% 17%)`, lines at opacity 0, text
  `data-hidden`. A paint before JavaScript (hard load, reload mid-page, slow hydration) can therefore
  never show the expanded frame or the statement.
- Reduced motion: no scrubbing. Tracks collapse to auto height, the frame is fully open, the statement
  is shown statically and the canvas renders one still frame per state change.
