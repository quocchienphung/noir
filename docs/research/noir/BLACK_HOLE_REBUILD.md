# Black-hole rebuild (5 Oct 2026)

Scope: the gas, lensing and motion of the two real-time scenes on `/`: the hero dive (`NoirIntro`,
`scene="dive"`) and the cinematic frame (`NoirCinematic`, `scene="cinematic"`), framed and open. The
scroll behaviour, layout, copy, logo, sticky tracks, reveal timings and camera paths are unchanged.
`tests/qa-scroll.mjs` passes as before.

Evidence lives in `docs/design-references/noir/black-hole-rebuild/`:

| Folder | Contents |
| --- | --- |
| `reference/` | Clean video stills (0:00, 0:15, 0:45), a 26-frame playback sequence (18.5–31.5 s), measurements |
| `before/`, `after/` | Capture matrix of the three states × 4 viewports at frozen time 12 s, no pointer, with `matrix.json` (buffer size, GPU, status) |
| `compare/` | Before/after sheets per state; reference vs QA camera; 1:1 feature crops |
| `qa-camera/` | QA-camera render, capture-state map, top-down views, flow-marker frames, measurements |
| `motion/` | 36 s sequences at fixed camera (animated WebP + per-frame statistics) |

## 1. Reference: Kalakaar FX, *Interstellar Gargantua Black Hole | 1 Hour Full HD Live Wallpaper*

Watched directly on <https://www.youtube.com/watch?v=784dsKVrdjQ> (1920×1080 source, 61:36). Frames
are screenshots of the watch page with the player chrome hidden. Each still was taken only after its
seek had finished decoding (`readyState` 4). Nothing is downloaded, embedded or served.

- **Stills captured:** 0:00.5, 0:15 and 0:45, at 1920×1080.
- **Continuous playback:** 18.5 → 31.5 s, 26 frames about 0.5 s apart.
- **Not captured:** seeks to 1:30 and 5:00 stalled (`readyState` 0, no decoded frame) and were
  discarded. The older `gargantua-video/yt-90.jpg` shows a loading spinner and is not used as evidence.

### Measured (method: `tests/lib/measure-blackhole.mjs`, radial edge detection with an angular window)

| Feature | Value | Spread across the 6 frames / detector settings |
| --- | --- | --- |
| Shadow centre | x 0.882 W, y 0.330–0.338 H | x 0.880–0.884, y 0.330–0.351 |
| Shadow radius | 0.293–0.303 H | 0.293–0.315 |
| Front band angle (upper edge across the shadow, rising to the right) | mean 20.3° | 15–26°; depends on texture, so it is a noisy feature |
| Brightest 2 % centroid (the white-hot junction) | (0.666 W, 0.395 H) | (0.645–0.669, 0.391–0.425) |
| Shadow interior median luma | 35–39 / 255 | lifted by haze, not black |
| Near-black fraction (L < 20) | 0.36 | 0.359–0.366 |

The shadow is cropped by the right edge of the frame, so its fit uses only the upper and side arcs.

### Observed, not measured

- The disk band crosses from the lower left and rises to the right.
- Its texture is mottled turbulent gas: copper flecks, dark lanes, ragged edges. It is not concentric
  lines.
- The upper lensed arc is thick, bright and finely streaked. The lower ring is thinner, with its own
  streaks.
- A thin bright photon ring hugs the shadow.
- A broad soft haze lifts the space around the bright gas.
- There are dust specks at the lower left, and a small dark moon to the left of the shadow. The moon is
  masked from comparisons and not added to NOIR.
- **Motion:** over 13 s the camera and hole are fixed while the gas flows and reshapes continuously. No
  loop seam was seen in the sequence. No optical-flow speeds were measured.

## 2. What made the old renderer look fake: proven causes and fixes

| Cause | Evidence | Fix |
| --- | --- | --- |
| **Inaccurate lensing.** Semi-implicit Euler with a coarse step. | `tests/qa-geodesic.mjs` against converged RK4: capture boundary 1.45 % inside 3√3/2, deflection errors up to **8.6°**. | Velocity Verlet with a step that shrinks near the photon sphere: 0.12–0.26 % and **< 0.2°** within the lowest tier's 200 steps. |
| **Infinitely thin disk with ad-hoc alpha.** One shading per plane crossing, colour × alpha blending. | Code: `shadeDisk` at y = 0. Baseline shows a flat sheet with no self-occlusion. | Gas slab of finite thickness (Gaussian, H = thickness·r, modulated by the gas itself), integrated front-to-back with emission and absorption: Δcol = T·j·(1−e^(−kΔs))/k. |
| **Concentric "wire" texture.** Four ln r noise lanes. | Baseline crops: hundreds of uniform rings. | GPU-baked tileable field; three advected scales (masses, mottling, filaments) plus macro regions and domain warp. Fine structure modulates temperature more than density, so arcs read as continuous streaked gas. |
| **Glittering, beaded ring and moiré.** Footprint guessed from travel and grazing angle, a −0.8 LOD bias, contrast boosted by 2^lod. | Baseline 1:1: dotted photon ring. | Ray differentials integrated with the geodesic (linearised equation) give the true pixel footprint, including lensing magnification. Filtering uses `textureGrad`, fades to the field mean once a footprint covers a texture period, and bounds aspect at 4:1. |
| **Concentric fringes near the shadow** (found during the rebuild). | Ablation `bhDebug=7` (all texture removed) still showed fringes: geometry, not texture. | Steep crossings of the thin inner slab undersampled its vertical profile. The step is now capped to a third of the local thickness per unit of vertical travel. Fringes are gone (`compare/` and the session crops). |
| **No inflow.** The pattern only rotated. | Code: `lnr` never advected. | Inflow v_s = 0.014·(2.9/r)^1.5 e-folds/s, ×6 inside the inner edge (plunging streams). Measured with the flow markers (§5). |
| **Pulsing/morph risk** from a two-phase crossfade (24 s). | Code. | Three phases with sin² weights (constant sum) and variance normalisation. Each phase's life scales with the local orbital period, so every radius gets the same shear and overlapping phases do not cross into hatching. |
| **Unresolved rays drawn as 60 % background.** | Code. | Rays still bound after the step budget are near the critical curve and are treated as captured. The capture-state view (`bhDebug=2`) shows no unresolved (blue) pixels in the QA views. |
| **Whole-frame brightness swelling and fading** (found during the rebuild). | Video: total brightness sd 0.6 % over 13 s (`reference/motion-stats.json`). Mine: 5.4 %, with smooth 0.6 s flares of +19 %. A difference image showed the inner annulus brightening coherently. A Karis bloom prefilter did not help; mean brightness without bloom still moved, so the cause is the gas. | Near the inner edge, D⁴ beaming makes the approaching side dominate the total, and a few large masses passing it swung the whole frame. Large-scale clumping and regional contrast now fade to their mean towards the inner edge, leaving only fine structure there, and heat³ became heat^2.2. Same window afterwards: ±0.7 %. The Karis prefilter is kept as firefly protection. |
| **Orange everywhere, grey haze, grain over everything.** | Baseline. | Linear-HDR palette (white-hot, champagne, copper, umber) driven by temperature × Doppler. Bloom plus a separate wide veil. Exact sRGB output. Grain is multiplicative, so blacks stay black. |
| **2.4× upscale at 2560 px; step count tied to resolution.** | `before/matrix.json`: 1075×605 buffer at 2560×1440. | Quality tiers fix step and sample budgets independently of resolution. Pixel budget 1.0 M (high) / 0.62 M (medium). At 2560 the buffer now starts at 1333×750 and adapts under load. |

Anisotropic filtering turned out to be the dominant cost. Each fine-layer fetch at up to 16:1
anisotropy cost about 8.5 ms. Capping it at 4:1 took the open cinematic frame from 23.4 to 8.6 ms of
GPU time, with no visible difference in the 1:1 crops.

## 3. The model

- **Space-time:** Schwarzschild, rs = 1. Photons follow x'' = −1.5 h² x/|x|⁵ (exact orbit equation).
  The camera is a static observer.
- **Gas (`gasAt`):**
  - stable disk from 2.9 rs (ISCO ≈ 3 rs) out to 16–17 rs, plus plunging streams down to 1.2 rs;
  - surface density ∝ (r_in/r)^0.9;
  - local thickness follows the masses and turbulence;
  - vertical shear of the coarse layer gives 3D structure (cloud tops at grazing view).
- **Flow:**
  - Keplerian orbit, Ω = 0.9·r^−1.5 rad/s; the sign sets the rotation sense (the cinematic and
    reference cameras put the approaching side on the left);
  - inflow as in §2;
  - three advected phases, each living 70 s × (r/2.9)^1.5.
  - The simulation clock is separate from scroll and only advances while frames render. Scrolling back
    never reverses the gas.
- **Emission:**
  - emissivity ∝ density × heat^2.2 × (r_in/r)^falloff × Doppler factor D⁴ (mixed) × redshift √(1−1/r);
  - large-scale masses fade towards the inner edge, which keeps the beamed junction statistically
    steady;
  - temperature drives a 4-stop palette and is shifted by the Doppler factor;
  - absorption ∝ density, so optically thick gas shows its source function: hot masses glow while the
    cooler lanes between them fall to umber.
- **Pipeline:**
  - trace into an RGBA16F target;
  - 7-level bloom (Karis-averaged, capped prefilter) plus a separate veil from the coarsest level;
  - 85 % ACES + 15 % hue-preserving tonemap, then sRGB, vignette, grain and dither.

### Parameters (`GasLook` in `src/lib/noir/blackhole/renderer.ts`, values in `scenes.ts`)

Values below are current after the V2 clarity pass (5 Oct 2026). The diagnosis, the reasons for each
change and the measurements are in `BLACK_HOLE_V2_CLARITY_ORBIT.md`.

| Parameter | Default | Unit / range |
| --- | --- | --- |
| `inner`, `outer` | 2.9, 16 | rs |
| `thickness` | 0.016 | H/r, 0.01–0.08 |
| `gain`, `falloff` | 42, 1.65 (dive 1.45) | linear HDR; emissivity exponent 1–3 |
| `opacity` | 30 | absorption per density per rs |
| `orbit` | ±0.9 | rad/s at r = 1 |
| `drift` | 0.014 | e-folds/s at the inner edge |
| `warp`, `filaments`, `clumping`, `plunge` | 1, 1, 0.6, 0.38 | 0–2, 0–1, 0–1, 0–0.6 |
| `period` | 28 (≈ 0.8 inner orbit; was 70) | s at the inner edge (∝ r^1.5) |
| `heat`, `doppler` | 1.15, 0.35 (cinematic/reference 0.45) | — |
| Quality tiers (`BlackHoleCanvas`) | high 280 steps / 40 samples per segment / 1.6 Mpx start; medium 240 / 26 / 0.9 Mpx; low 200 / 16 / 0.45 Mpx | canvas at output size (CSS × min(DPR, 2)); the traced buffer adapts to a GPU budget of ≤ 13 ms (≈ 90 % of whole display intervals), then the tier drops |

### Gas texture source

`BAKE_FRAG` renders the field on the GPU once per context. It is a 512×512 RGBA8 tile, mipmapped, with
4× anisotropic filtering:
- **R:** fBm, 6 octaves, base period 4;
- **G:** fBm, 5 octaves, base 8;
- **B:** ridged, 4 octaves, base 8;
- **A:** fBm, 4 octaves, base 2.

Every octave is shifted by a fraction of a cell, so octaves no longer share the coarse lattice's zero
points (those lined up into straight moiré bars across a face-on disk). Tile scales in the trace shader:
masses (R) 2 × 1, filaments (B) 1 × 8, clumps (G) 8 × 12 tiles per revolution × per e-fold of radius.

It uses periodic gradient noise with an integer hash and seed `0x6e6f6972`, so it is deterministic. It
is input data for the 3D renderer; no frame of the video is used.

## 4. QA camera vs reference (same measurement idea, different detector)

The development-only `/qa/black-hole?scene=reference` (routed only under `next dev`) uses
`REFERENCE_CAMERA`: d = 28.9 rs, elevation 2.6°, vertical FOV 18°, yaw 12.14°, pitch 3.3°, roll −20.5°.
Distance and aim were solved from the measured shadow (sin θ = (b_c/d)·√(1−1/d)), then refined against
the render's exact capture map (`measureCaptureMask`: circle through the boundary between captured and
escaped rays).

| Feature | QA camera | Reference | Difference | Proposed tolerance |
| --- | --- | --- | --- | --- |
| Shadow centre x | 0.8848 W | 0.882 W | 0.3 % | ≤ 1 % ✓ |
| Shadow centre y | 0.3212 H | 0.330–0.338 H | 0.9–1.7 % | ≤ 1 %: met only against the lower reference estimate |
| Shadow radius | 0.2930 H | 0.293–0.303 H | 0–3.3 % | ≤ 3 %: borderline |
| Band angle | 19.8° | 20.3° mean (15–26°) | 0.5° from the mean | ≤ 2° vs the mean ✓; the reference itself spreads ±5° |
| Highlight centroid | (0.671, 0.385) | (0.666, 0.395) | 0.5 % / 1.0 % | — |

The two measurements use different detectors: bright-edge detection on the video, and the exact capture
boundary on the render. The video has no capture map, so the y and radius comparisons carry about 1 %
of method uncertainty. This is not a claim of "100 %" similarity.

### Remaining visual differences (QA camera, `compare/crop-*.jpg`)

- **Front band:** the video is brighter and more saturated, with much finer copper speckle and dark
  lanes. Mine is softer, smoother, and more beige near the left edge.
- **Upper arc:** the video's arc is broader and extends further up and to the left at full brightness.
  Mine is narrower.
- **Photon ring:** a thin bright ring now hugs the shadow edge, but it is thinner and less luminous than
  the video's crisp white ring. The highest-order images are deliberately filtered to their mean, and
  unresolved rays are treated as captured.
- **Haze:** the video's veil is stronger around the junction and lifts more of the frame. I kept less,
  because more washed out the gas structure.
- **Not reproduced:** the dust specks at the lower left and the moon.

## 5. Motion (fixed camera; `tests/qa-blackhole-motion.mjs`, 0–36 s in 1 s steps)

Frames were rendered at frozen simulation times (exactly deterministic), 960×540, high tier, native
scale, grain off. Phase boundaries fall inside this window at every radius near the inner edge.

| Scene | Frame luma (mean ± sd) | Inner region luma (mean ± sd) | Δ to previous frame (mean, max ÷ median) | Same time rendered twice |
| --- | --- | --- | --- | --- |
| Reference video (13 s, 26 frames) | 63.4 ± 0.36 (0.6 %) | 119.7 ± 1.9 (1.6 %) | 4.5, 1.11 | — |
| QA camera | 41.7 ± 0.73 (1.8 %) | 97.6 ± 1.7 (1.7 %) | 2.2, 1.16 | identical |
| Cinematic open | 24.8 ± 0.62 (2.5 %) | 41.7 ± 1.5 (3.6 %) | 1.8, 1.13 | identical |
| Hero p = 0 | 29.9 ± 0.70 (2.3 %) | 56.4 ± 2.4 (4.2 %) | 3.7, 1.04 | identical |

- **No pops or seams:** the largest step stays within 1.16× the median, the same order as the video's
  1.11.
- **Determinism:** a frame rendered twice at the same time is pixel-identical, so there is no boiling
  noise and no seed reset.
- **Brightness stability:** below 2.5 % frame sd. Before the inner-edge fix it was 5.4 %, with +19 %
  flares.
- **Clip:** `motion/*.webp` (36 frames, 1 s apart, documentation only).
- **Finer sampling:** 0.1 s steps over 5–8 s (QA camera) vary by only ±0.7 %.

**Inflow, measured** with the flow markers (`bhDebug=3`: knots fixed in the flow's co-moving frame),
top-down QA camera, t = 0 → 1 s:
- 23 knots tracked (final parameters); **96 % move inward**;
- mean d(ln r)/dt = −0.00278 /s, against the model's −0.00282 /s;
- orbital rate measured at 1.16× the model, because centroids are quantised to pixels and lensing near
  the hole biases positions.

The phase-blended texture uses the same co-moving mapping (age → φ + Ω·age, ln r − v_s·age), so its
features drift inward the same way. Inside the inner edge the inflow is 6× faster: plunging streams
stretch and fade with the redshift.

## 6. Performance (measured; development GPU timer)

Setup: Chrome (Playwright, `channel: chrome`), ANGLE D3D11, NVIDIA GeForce RTX 4070 SUPER, 1440×900 at
DPR 1. The figure is the median `EXT_disjoint_timer_query_webgl2` time of one full frame (trace,
bloom, composite) over about 60 frames, at a fixed buffer of 1267×792 (high tier).

| State (buffer 1267×792 unless noted) | Before the 4:1 cap | Final GPU time | RAF median / p95 |
| --- | --- | --- | --- |
| Hero p = 0 | 23.4 ms | 8.9 ms | 6.1 / 18.2 ms |
| Hero p = 0.5 (shadow fills the view) | 32.7 ms | 12.3 ms | 12.1 / 24.2 ms |
| Cinematic framed | 17.0 ms | 6.3 ms | 6.1 / 12.1 ms |
| Cinematic open | 23.4 ms | 8.3 ms | 6.1 / 18.2 ms |
| Cinematic open, low tier | 22.3 ms | 8.3 ms | — |
| Cinematic open, medium tier, 390×844 native (phone size, desktop GPU) | — | 4.0 ms | — |
| QA camera, 1920×1080 native | — | 15.2 ms | — |

The tiers barely change GPU time: texture filtering dominates, not step or sample counts. The real
scaling lever is resolution, which the canvas adapts first.

- The old renderer was not measured with the GPU timer, which was added during this work. Its RAF
  interval sat at the display's 6.1 ms vsync floor.
- RAF intervals are quantised to that 6.1 ms floor, so they are not used as GPU numbers.
- **Not measured:** real mobile devices and integrated GPUs. On them the canvas adapts resolution
  (down to 0.32) before dropping a tier, and every tier keeps the same model, motion and silhouette.

## 7. Development-only tools (never in production bundles)

- `/qa/black-hole`, routed only under `next dev` via `pageExtensions: dev.tsx`. Parameters:
  - `scene=reference|dive|cinematic|topdown`, `p`;
  - `bhT` freezes the simulation time; `bhPtr=0` ignores the pointer;
  - `bhQ` sets the tier; `bhScale` sets the render scale;
  - `bhDebug`: 1 density, 2 capture state, 3 flow markers, 4 no filaments, 5 no mottling, 6 single
    phase, 7 no texture;
  - `bhView`: 1 no bloom, 2 radiance; `bhGrain=0` turns grain off.
- `canvas[data-buffer]`, `[data-tier]`, and `[data-gpu-ms]` (development builds only).
- `tests/qa-geodesic.mjs`, `tests/qa-blackhole.mjs` (capture matrix), `tests/qa-blackhole-motion.mjs`,
  `tests/qa-blackhole-runtime.mjs` (production runtime: live canvas, context loss and restore, reduced
  motion, no-WebGL poster, dev hooks absent), and `tests/lib/{measure-blackhole,track-markers,side-by-side}.mjs`.
- `scripts/render-noir-posters.mjs` regenerates the fallback posters from the new scenes.
