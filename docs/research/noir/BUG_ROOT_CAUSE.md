# Image-1 bug: giant white statement over or outside the media frame on returning home

## Reproduction (previous build, before NOIR)

Captures are in `docs/design-references/noir/bug/`:
- `clientnav-*.jpg`: `/about` → Home → scroll through the section;
- `hard-*.jpg`: hard load;
- `back-*.jpg`: browser Back;
- `reload-{50,300,1500}.jpg`: reload at scrollY 3900, sampled 50 / 300 / 1500 ms after load;
- `bug-sheet.jpg`: summary.

Reloading mid-section showed the **full-bleed** water and the white "Crafting spaces…" statement at
t ≈ 50 ms. The framed state only appeared at ≈ 300 ms. After client navigation the statement could sit
outside, or on top of, the scaled frame.

## Root cause

1. **Wrong CSS default.** `.section { --nd-video-p: 1 }` made the *expanded* state the default. Until the
   shared scroll scheduler's first frame wrote the real progress, any paint (hard load, reload
   mid-section, restored scroll on Back, a slow hydration after client navigation) showed the expanded
   frame. On tablet and phone the code forced `p = 1` permanently.
2. **The text was not inside the frame.** The statement was a separate sticky `FitText` SVG layer
   (`overflow: visible`, absolutely positioned, z-index 2). Its size came from its own viewBox, not from
   the frame's clip. When the frame was scaled (0.66 → 1) or the progress was stale, the statement kept
   viewport-sized geometry and painted beyond or over the frame.
3. **State inferred, not derived.** Progress lived in a CSS variable that only an rAF callback updated.
   Nothing re-derived it synchronously on mount, so the first frames after a route transition, a font
   swap (which changed the FitText metrics) or a resize could show a mismatched frame and text.

The fixed header was not the cause. Its z-index was correct; the overlap came from the stale and
unclipped statement layer.

## Fix (`NoirCinematic`, `cinematic-timeline.ts`, `useScrollTimeline.ts`)

- CSS defaults are the safe **framed** state: small clip, statement hidden.
- The state comes from a pure function of the track's real `getBoundingClientRect()`. It is applied in
  `useLayoutEffect` before first paint, and again on resize, `document.fonts.ready`, reduced-motion
  change, and every frame of the render loop (or on scroll while the loop is paused).
- Canvas, mark and statement live inside **one** element clipped with `clip-path: inset()`, so nothing
  can render outside the frame.
- The statement is real HTML text in a safe area: inside the gutters, above a bottom margin, with a
  `max-height` that keeps it below the header. There is no FitText/SVG scaling.
- Smoothing never trails the real position by more than 0.12, and `pinned` is derived from the same
  smoothed progress, so state and geometry always agree.
- The exit fade completes (q 0.93) before the stage releases at q = 1.

## Guard

`tests/qa-scroll.mjs` checks invariants on **every animation frame** through:
- keyframes at 0/25/50/75/100 % in both directions, at 1440, 1280, 768, 390 and 320 px;
- `/about` → logo, `/projects` → menu Home (phone), `/contact` → footer Home;
- Back/Forward with scroll restore, reload mid-section;
- fast wheel bursts and back to top;
- live resize across breakpoints, and reduced motion.
