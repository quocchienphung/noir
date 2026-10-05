# Black hole V2: clarity and 360° orbit (5 Oct 2026)

Scope: MASTER PROMPT V2 in `prompt/NOIR_BLACK_HOLE_REBUILD_PROMPT.md`. It has two outcomes:

1. The hero is sharp at **default production quality**, with readable filaments and dark lanes.
2. The hero can be explored as a **real 3D 360° orbit**.

Unchanged: the scroll timeline, sticky tracks, section heights, reveal marks, copy, logo, CTAs, layout and
the scroll camera paths. There is no footage, iframe, video texture, image sequence or bitmap of a
black hole. Every frame is ray-traced from the scene each time.

Evidence: `docs/design-references/noir/black-hole-v2/` (folders listed in §7).

## 1. Sources (read 5 Oct 2026)

| Source | What it says | What we did with it |
| --- | --- | --- |
| NASA SVS 13326, "Black Hole Accretion Disk Visualization" (J. Schnittman, NASA GSFC, 25 Sep 2019), <https://svs.gsfc.nasa.gov/13326> | Face-on, the disk is symmetric with no brightness asymmetry. Edge-on, distortion is greatest. Seen from below, the gas appears to move the other way (a clock seen from behind). The photon ring is a stack of ever-fainter rings from light that circled two, three or more times. | Orbit matrix check **O4**: face-on left/right ≈ 1, edge-on clearly asymmetric. The 85°/95° pair is checked for mirrored humps and reversed apparent motion. Ring stack: §5. |
| NASA, "NASA Visualization Shows a Black Hole's Warped World" (25 Sep 2019), <https://www.nasa.gov/universe/nasa-visualization-shows-a-black-holes-warped-world/> | Near edge-on, the far side is lensed above and below the hole ("double-humped"). The approaching side is brighter. The asymmetry vanishes face-on. | The same checks, plus the 360° matrix rows i = 85/90/95°. |
| NASA Science, "Black Hole Anatomy", <https://science.nasa.gov/universe/black-holes/anatomy/> | The shadow is roughly twice the horizon. Thin rings at the shadow edge are multiple, highly distorted images of the disk. Matter works inward to the inner edge, then falls in. | Shadow size is set by the geodesics (unchanged). Inflow is measured: `qa-blackhole-flow` F2, plus plunging streams inside the edge. |
| O. James, E. von Tunzelmann, P. Franklin, K. S. Thorne, "Gravitational lensing by spinning black holes in astrophysics, and in the movie Interstellar", CQG 32 065001 (2015), arXiv:1502.03808 (PDF read) | p. 1: "ray-bundle techniques were crucial for achieving IMAX-quality smoothness without flickering". p. 5 and §IV: the film's disk **omitted Doppler and gravitational frequency shifts** (and their brightness changes) by choice. | Ray differentials stay the basis of texture filtering (§3). Beaming is kept, but moderate (doppler 0.35 hero, 0.45 cinematic), between physics and the film look the user asked for. |
| E. Bruneton, "Real-time High-Quality Rendering of Non-Rotating Black Holes" (2020), arXiv:2010.08735 (abstract read) | Real-time Schwarzschild rendering using precomputed deflection tables (constant time per pixel) and a texture filtering scheme that integrates the light sources per beam. | Read for context only, not adopted. We integrate the geodesics per pixel, because the gas is a volumetric slab, not a thin disk lookup. The lesson we kept is that filtering must use the beam footprint. |

Physical assumptions: static observer, Schwarzschild metric (non-rotating, rs = 1), Keplerian gas in a
finite-thickness slab, and Beer–Lambert emission/absorption. Beaming uses the static-frame Keplerian
speed. The explore camera is an interactive survey camera. It is a viewpoint, not an orbiting observer:
there is no aberration from camera motion.

## 2. Diagnosis: where the blur came from (ablation matrix A–G)

Setup: hero p = 0, t = 12 s, pointer 0, 2544×1290 device px (the user's screenshot size). "fine" is the
RMS of (luma − Gaussian σ = 2 blur) ÷ mean luma in a 400×260 crop. It is a diagnostic only: noise raises
it too. Data: `v2-diag/metrics.json`.

| Variant | Buffer | GPU ms | upper arc | junction | front band | lower arc | shadow edge |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A production, default quality | 1404×712 | 8.6 | 0.106 | 0.041 | 0.066 | 0.041 | 0.051 |
| B native buffer | 2544×1290 | 26.3 | 0.160 | 0.070 | 0.116 | 0.073 | 0.072 |
| C B without grain/bloom/veil | native | 26.3 | 0.167 | 0.069 | 0.116 | 0.076 | 0.085 |
| D1 C without fade-to-mean | native | 26.1 | 0.168 | 0.070 | 0.116 | 0.077 | 0.087 |
| D2 C without anisotropy bound | native | 26.1 | 0.167 | 0.069 | 0.116 | 0.076 | 0.085 |
| D3 C without step-footprint fold | native | 34.2 | 0.167 | 0.084 | 0.130 | 0.096 | 0.086 |
| E1 C without inner-edge suppression | native | 26.1 | 0.213 | 0.102 | 0.117 | 0.093 | 0.127 |
| E2 C, full filament contrast | native | 26.3 | 0.172 | 0.070 | 0.118 | 0.078 | 0.087 |
| F1 C, slab half as thick | native | 25.4 | 0.173 | 0.095 | 0.145 | 0.111 | 0.094 |
| F2 C, 4× optical depth | native | 23.5 | 0.163 | 0.116 | 0.215 | 0.122 | 0.094 |

What it shows (measured):

1. **Upscaling (A vs B): the largest single loss.** The default buffer was 55% of the output and was
   upscaled bilinearly, losing ~35–45% of fine structure.
2. **Post-processing (B vs C): not a cause.** Grain, bloom and veil change little.
3. **Filtering stages (D1, D2): not a cause.** D3 gains a little at +30% GPU, so it was kept.
4. **The material itself (E1, F1, F2) was the second cause.** The inner-edge suppression, a slab
   that was too thick, and low optical depth averaged structure into haze.

Code review found three more material causes:

- **Layer frequencies sized without the bake's base frequency.** The mottling and filament layers had
  ~300–500 features per e-fold of radius. That is sub-pixel at hero size, so they read as sand or were
  filtered away.
- **Filtered detail faded to 0.5** rather than to each curve's real mean, which pulled contrast towards grey.
- **Reversed `smoothstep` edge calls.**

## 3. Fixes (in order, each measured)

| # | Change | Where | Effect |
| --- | --- | --- | --- |
| 1 | Canvas at **output resolution** (CSS × min(DPR, 2)). Only the traced buffer scales, and the composite upsamples it with **Catmull-Rom** (9 taps). | `renderer.ts` `resize(outW, outH, scale)`, COMPOSITE `catmullRom()` | Upscale blur replaced by a sharper reconstruction. |
| 2 | **Adaptation on measured GPU time** (`EXT_disjoint_timer_query_webgl2`, now also in production), with a cadence fallback and hysteresis. Budget ≈ 60 fps of work, kept ~10% under whole display intervals (60/120 Hz → 13 ms, 144 Hz → 12.5, 165 Hz → 10.9). | `BlackHoleCanvas.tsx` `adapt()` | The buffer goes from 1404×712 to ~1780–1980 × 900–1000 at the user's viewport, stable from 1 to 20 s. A flat 12 ms sat exactly on two 165 Hz intervals, and p95 frames slipped to 24 ms. |
| 3 | Field **z-scores** from exact channel mean/std read back after the bake. Each curve fades to its own expectation under a unit normal. | TRACE `gasAt`, `renderer.ts` `bakeGas` | Filtering keeps brightness instead of greying. |
| 4 | **Layer counts sized for hero pixels**: masses 2×1, filaments 1×8, clumps 8×12 tiles (per revolution × per e-fold). Integer tiles per revolution, so the φ = ±π seam is gone (it was visible at SA.x = 1.5). | TRACE `SA`, `SS`, `SK` | Filaments and clumps are visible instead of sand. |
| 5 | **Dark lanes as thin gas**: inner-edge suppression removed, slab 0.016·r, filaments 1. **Streaks and clumps add instead of multiplying.** | TRACE `body`, `heatOut`; `scenes.ts` `GAS` | Lanes read as gaps. The product had chopped every filament into short slanted dashes ("hair"). This was proven by ablating each layer (`bhDebug` 4/5). |
| 6 | **Phase life 70 → 28 s** at the inner edge (≈ 0.8 orbit, ∝ r^1.5). | `GAS.period` | Two orbits of Keplerian shear (≈ 19 rad per e-fold) had wound clumps into fine threads. |
| 7 | **Bake octaves shifted off the shared lattice.** Gradient noise is zero on its lattice, and doubling periods share the coarse points. | BAKE `octShift` | Removes straight moiré bars across the face-on disk (orbit matrix i = 0/180). |
| 8 | Transform-driven size changes are followed: the cinematic frame scales 1.14 → 1 without firing ResizeObserver. | `BlackHoleCanvas.tsx` render loop (> 4% steps) | The opened frame is no longer traced at the framed size, and the reverse case (upscale blur) is gone. |
| 9 | Debug single-phase mode normalises with the real weight sum. | TRACE | `bhDebug=6` is usable for diagnosis. |

Iteration log (default-quality A at 2035×1032 @1.25 unless noted; `v2-iter*/metrics.json`,
`v2-final/metrics.json`):

| Step | Buffer | upper arc | junction | front band | lower arc | shadow edge |
| --- | --- | --- | --- | --- | --- | --- |
| complained (A, `v2-diag`) | 1404×712 | 0.106 | 0.041 | 0.066 | 0.041 | 0.051 |
| iter1 (native B, first layer redesign; visibly too grainy) | native | 0.549 | 0.212 | 0.209 | 0.278 | 0.307 |
| iter3 A | 1896×961 | 0.354 | 0.137 | 0.139 | 0.178 | 0.180 |
| iter4 A | 1889×958 | 0.316 | 0.133 | 0.143 | 0.189 | 0.175 |
| **final A** | 1776×901 | **0.354** | **0.115** | **0.121** | **0.119** | **0.192** |

Final ÷ complained: 3.3×, 2.8×, 1.8×, 2.9× and 3.8× respectively. The front band dropped from iter4
(0.143 → 0.121) on purpose. The "hair" there was pixel-scale strokes, which the σ = 2 metric counts as
detail. The final clumps are larger, darker-laned and closer to the video frame. That judgement is
visual (`compare/`), not a measurement.

## 4. 360° explore

- **States:** `scroll → entering → orbit → returning → scroll` (`orbit.ts` `OrbitController`). One owner
  resolves the camera each frame (`CameraHook`). While a hook owns the camera, pointer parallax and wobble
  are off. Gas time is independent of the camera.
- **Rotation:** quaternion. Yaw turns about world +Y (its sign flips when upside down); pitch turns about
  the camera's own right axis. There is no clamp, and both poles can be crossed. Transitions use slerp on
  the orientation and interpolate the position on the sphere. Inertia uses τ = 0.16 s, capped at 6 rad/s,
  and stops below 0.05 rad/s.
- **Entry:** the "Explore 360°" button, a click or tap on the media, or a mouse drag that starts on the
  media (5 px threshold). It is offered only while WebGL is live and the hero is at its opening (p < 0.05).
  Touch: any movement before lifting the finger is a page scroll, so the page is never hijacked.
- **Surface:** while active it has `touch-action: none` and pointer capture. It handles arrow keys, Reset
  and Close (`aria-label="Close 360° view"`), and no controls sit inside `aria-hidden`.
- **Exit:** Close, Escape, mouse wheel or a real page scroll. The camera blends back to the live scroll
  pose, and focus returns to the entry button.
- **Aborted gestures** (pointercancel, lost capture, blur, hidden tab) stop without coasting (`dragCancel`).
- **Reduced motion:** blends are instant and there is no inertia.
- **No WebGL:** the entry button is hidden and the poster stays.

## 5. Lensing, motion direction and light by viewpoint (checked)

Measured with `tests/qa-blackhole-orbit.mjs` and `orbit/`:

- **Closure:** azimuth 360° ≡ 0° (mean |Δ| = 0).
- **Pole pass:** a 1° pitch path over the pole changes evenly (≈ 10.6 per step, no jump).
- **Doppler:** face-on left/right is 0.98 / 0.98; edge-on (i = 85°) it is 1.26.
- Rows 85° and 95° show mirrored humps. Edge-on (90°) shows the line plus the Einstein ring. Face-on
  shows concentric rings with a photon ring at the shadow edge.

Measured with `tests/qa-blackhole-flow.mjs` (beauty gas, no markers, from above):

- the gas rotates in the model's sense at 1.3–1.6× the model rate (visible pattern speed: the blend of advected phases moves slightly faster than Ω);
- the radial shift is inward or zero in every band.

From below, the apparent sense reverses (view geometry; NASA SVS 13326). This is seen in the 95–180°
rows. It is a visual check; it isn't measured.

## 6. Default-quality sharpness and pacing (measured, `next dev`, this machine)

These numbers come from `tests/qa-blackhole-sharpness.mjs` on the real page after the adaptive scale has
settled. The display is ≈ 165 Hz (6.06 ms).

- **Buffer vs output.** At 1440×900 the buffer is native (1440×900) at p = 0. At 1920×1080 it is ≈ 82–88%.
  At 2560×1440 it is ≈ 53–66%. At the user's 2035×1032 @1.25 it is ≈ 61–75%. At 390×844 @3 it is
  ≈ 83–100% of a DPR-2 output.
- **Frames.** The median is 12.1 ms (half of 165 Hz) and p95 is 18–24 ms. Runs varied a lot (some runs
  showed 24 ms medians at unchanged GPU time), so other GPU load on this machine affects these numbers.
- **Drag** (`tests/qa-explore-pacing.mjs`). At 2035×1032 @1.25 the median is 12.1 ms and p95 18.2 ms
  during 8 s of continuous dragging. The scale dips 0.698 → 0.651 and returns to 0.691 after leaving
  (99%). At 1440×900 the scale stays at 1.0, with p95 12.3 ms during the drag.
- **Motion** (`tests/qa-blackhole-motion.mjs`, hero, 36 s in 1 s steps). Frame luma varies ±3%, frame
  deltas are even (max/median 1.02, no phase pop), and frozen time is deterministic.

**Production build** (`next build`, standalone server, live time):
- `qa-blackhole-sharpness` passes (`sharpness-prod/`). The hero buffer is 1440×900 native at 1440×900,
  1687×949 at 1920 and 2560, 725×1570 of a 780×1688 output at 390×844 @3, and 1776×901 of 2544×1290 at
  the user's viewport.
- During a drag at the user's viewport, `qa-explore-pacing` gives a median of 12.1 ms and p95 18.1 ms.
  The scale returns to ≥ the settled value.
- `qa:routes`, `qa:scroll`, `qa:independence`, `qa:blackhole` and `qa:visual` pass. `/qa/black-hole`
  returns 404, and dev queries are ignored.

## 7. Evidence index (`docs/design-references/noir/black-hole-v2/`)

| Folder | Contents |
| --- | --- |
| `baseline/` | the user's screenshot of the previous build |
| `reference/seq314/` | 28 frames of the reference video from 314.98 s (research only, see `MEDIA_PROVENANCE.md`) |
| `v2-diag/` | ablation matrix A–G, 1:1 PNG crops of five regions + full frames |
| `v2-iter1…4/`, `v2-iter5/`, `v2-final/` | the same crops after each change |
| `compare/` | per region, 1:1, four columns: first version (1440×900 JPEG capture, scaled region) · complained version · final · video frame (different framing: same feature chosen by eye) |
| `sharpness/`, `sharpness-prod/` | matrix (dev server / production build): 5 viewports × hero p 0/0.25/0.5 + cinematic framed/open, device-pixel PNGs, `metrics.json` |
| `orbit/` | 360° matrix i 0…180 × az 0/90/180/270, `matrix.jpg`, `metrics.json` |
| `explore/` | interaction frames (scroll → orbit → yaw turns → pitch over both poles → reset → exit) |
| `motion/` | real-time WebM: `beauty-hero-40s`, `beauty-cinematic-40s` (no markers, live time), `pacing-*` (drag session) + JSON. Playwright's WebM is compressed: use it for motion, not sharpness. |
| `motion-hero/` | deterministic 36 s sequence (animated WebP) + metrics |

Tests added: `qa-blackhole-clarity`, `qa-blackhole-sharpness`, `qa-blackhole-orbit`, `qa-blackhole-flow`,
`qa-explore`, `qa-explore-lifecycle`, `qa-explore-pacing` (all under `tests/`, `npm run qa:*`).

## 8. Limits and open points

- **Not identical to the video.** The video is a pre-rendered film frame (different camera, lens bloom and
  haze, no real-time budget). Here the material is matched in character (filaments, dark lanes, white-hot
  inner gas), not pixel for pixel.
- **Faint axis-aligned alignments remain** in the clump layer seen exactly face-on with all texture
  except clumps removed. They stay put when the texture content changes and rotate with the camera. The
  cause is not identified; direction-dependent hardware filtering is a guess. They are hard to see in the
  full render.
- **The fine-structure metric is a diagnostic**, not a quality score. The material choices were judged
  visually against the video.
- **Pacing** was measured on one machine (≈ 165 Hz display, discrete GPU, other GPU clients active).
  Phones and integrated GPUs were not measured on hardware; the 390×844 @3 rows are desktop emulation.
- **The 2560×1440 hero** at p ≥ 0.25 settles near a 2× upscale on this GPU (a budget limit).
