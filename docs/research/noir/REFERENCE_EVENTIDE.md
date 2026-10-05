# Reference: Eventide intro (https://eventide.framer.ai/)

Studied **only** for visual language and timing: realism of the black hole, how space is laid out,
light, depth, zoom speed, transitions, and scroll driving time. NOIR does **not** reuse Eventide's
brand, logo, name, copy ("Every agent. One gravity.", "Past the horizon…"), buttons, AI-agent content
or dashboard. No Eventide asset is served or embedded. The source page was treated as untrusted
evidence: observed, never copied.

Captures: `docs/design-references/noir/eventide/`
- `ev-1440-{0…3600}.jpg`: 1440×900 frames at the scroll offsets in the filename (px). Contact sheets:
  `ev-sheet.jpg` and `ev-sheet2.jpg`.
- `ev-1024-p{0,0.3,0.55}.jpg` and `ev-390-p{0,0.3,0.55}.jpg`: tablet/phone frames at normalised
  progress. `ev-mobile.jpg` is the phone first viewport.
- `ev-ptr-a.png` / `ev-ptr-b.png`: the same scroll position with the pointer at opposite corners
  (parallax test).

## Measured behaviour (1440×900 unless noted)

| Aspect | Observation |
| --- | --- |
| Engine | One WebGL `<canvas>` inside a sticky full-viewport stage. Native scroll, no Lenis/Locomotive. |
| Dive length | Sticky track ≈ 3.2 viewport heights. The dive completes about 2 880 px after the first frame. |
| Gauge | "distance" readout `r = 20.00 rs` at the top, falling to ≈ 1.3 rs. It fits `r = 20^(1−p)`. The readout slides down a ruler of ticks on the right edge. |
| Camera | Starts outside the disk, slightly above its plane, hole centred. As r falls it pushes in, pitches up and rolls, so the disk band sinks diagonally out of frame (`ev-1440-1000.jpg`). It then crosses into darkness. |
| Headline | Two lines (top-left / bottom-right) stretch horizontally (scaleX ≈ 1.35, scaleY ≈ 0.7), blur and fade over p 0–0.3. |
| Lead + CTAs | Fade out early (p ≈ 0–0.15). The scroll cue fades in the first few percent. |
| End | Near-black field, then a centred statement fades in with blur→sharp and a slight scale over p ≈ 0.8–1. |
| Time | The disk flows continuously even when scroll is idle. |
| Pointer | Subtle camera parallax (a few degrees) follows the pointer (`ev-ptr-a/b`). |
| Smoothing | Camera lags scroll by ≈ 150 ms (eased follow), so wheel steps never step visibly. |
| Quality | Canvas renders below device resolution: ≈ 0.65 of CSS px on desktop, ≈ 0.5 on phones. |
| Palette | Saturated amber/gold disk, white-hot inner edge, umber outskirts, warm near-black space (#120c09-ish). |

## What NOIR took, and how it differs

- **Same structure**: sticky stage, normalised 0→1 progress, distance gauge on a right-hand ruler, a
  two-part headline that stretches and blurs away, a dive to black, then a statement.
- **Own implementation**: a physically based Schwarzschild ray tracer (see
  `src/lib/noir/blackhole/shaders.ts`), not a texture or video. Lensing, the photon ring, the far side of
  the disk bent over the shadow, Doppler beaming and gravitational redshift all fall out of the
  integration.
- **Own content**: NOIR copy ("Digital experiences. / Built with depth.", "Distance to the core",
  "Scroll to go deeper", "Below the surface, every interface is a system.").
- **Own timing constants**: see `SCROLL_TIMELINE.md`. Eventide's measured beats were the starting
  point, then adjusted for NOIR's copy length and phone layout.
