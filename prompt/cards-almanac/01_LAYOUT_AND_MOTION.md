# Cards Almanac — layout and scroll specification

## Evidence vs implementation choices

Source: public desktop preview, 1920 × 1366, 30 fps, approximately 2.93 seconds. Seek timestamps are recording samples, **not** animation durations or scroll percentages. No original component DOM/CSS was exposed. All dimensions below are image estimates and initial tuning values, not extracted CSS.

Compare frames at identical normalized composition. Do not copy encoded pixel dimensions directly into a 1440 px browser or include GetLayers modal chrome.

## Desktop composition

- Warm off-white/ivory background, subtle tonal texture if useful; no conspicuous grain overlay.
- Header centered above the first card, with substantial breathing room. Small uppercase/spaced eyebrow, large bold black heading and compact gray subtitle. Use actual NOIR copy from the content spec.
- Card outer width roughly 77–80% of the captured viewport; about 10–12% horizontal margins. Use a centered fluid container with a sensible large-screen max-width after comparison.
- First card begins around 30% of captured frame height. Front card height is roughly 44–47% of that frame, driven by its square-ish image and padding. These are composition measurements, not mandatory `vh` heights.
- White rounded surface; large corner radius, approximately 36–44 encoded pixels at 1920 px width. Soft broad shadow distinguishes overlapping layers without a heavy outline.
- Approximately 24–32 encoded pixels of inner padding. Two columns: image around 41% of usable card width, remaining width for text, gap around 40–50 encoded pixels. Tune at native resolution.
- Cover is nearly square with its own smaller rounded corners, clipping overflow. Preserve aspect ratio and use appropriate object-fit for the author-supplied preview; do not stretch website screenshots.
- Right column: small metadata row, readable editorial description/title, extensive quiet middle space, then category pill and circular plus control on one bottom row.
- Main card copy is legible at rest. Behind cards reveal narrow upper bands, not several complete cards competing for attention.

Keep source palette and structural hierarchy for the first implementation. Scope it locally. Use existing project fonts unless a verifiable freely usable reference font can be obtained; report a font substitution rather than fabricating an exact match. The global header must retain usable contrast over this light section; prefer an existing theme mechanism and keep any adjustment limited to this region.

## Observed movement

| Clip seek | Observable state |
| --- | --- |
| 0.00 s | Header and first orange/blue cover visible; no large stack yet. |
| 0.20 s | Header leaving upward; first card reaches the pinned area. |
| 0.40–0.80 s | Second red cover enters from below and progressively overlaps the first; text becomes readable as it settles. |
| 1.00–1.40 s | Third green/purple cover rises; previous cards leave staggered upper edges and recede in width. |
| 1.60–2.00 s | Fourth yellow/blue card overlaps and settles; compact stack remains visible. |
| 2.20–2.60 s | Fifth pink/orange cover joins the front. |
| 2.80 s | A sixth cover begins entry; clip does not establish the final unpin behavior. |

Native scrollbar progression is visible. Recreate this as scroll-driven movement; the fact that the library preview autoplays is not a request for timed autoplay in NOIR.

## Suggested motion model — tune to the evidence

Use a tall section with one sticky stage and a semantic ordered list. Keep native scrolling. Let N be card count and derive the track length from N, viewport and usable card height; do not retain the old fixed 300svh tesseract track.

Reserve one readable entry phase, one overlap interval per subsequent card, and a final hold/release. An initial overlap interval of roughly 0.7–1.0 viewport heights is a tuning hypothesis, not measured reference timing. Ensure the actual card fits below the fixed header before activating sticky behavior.

For a normalized target progress, derive a deterministic local progress for each incoming card. Use smooth monotonic easing within each interval:

1. Incoming card starts below the visible front card; rising motion is chiefly vertical. It becomes the highest z-index layer.
2. Near overlap, its horizontal-axis lean approaches zero. Initial rotateX around 3–7 degrees is only a tuning range; use subtle perspective and stable transform-origin, never a tumbling panel.
3. Previous front card retreats slightly in scale, around 0.96–0.98 per recent layer as a starting range. Preserve its center alignment and a narrow top-edge reveal.
4. Compress/cap older layers so a long list cannot shrink to illegible strips or accumulate unlimited offset. Start with roughly 12–22 CSS px reveal and 3–4 distinguishable back layers at desktop, then compare frames.
5. Cover zoom occurs inside the clipped cover, initially around 1.00 → 1.04–1.08. It must not change card layout or blur type. Tune this modestly from the video.
6. Incoming text may fade in during the approach; settled text is fully opaque. Do not turn active copy into a low-contrast ghost.

All initial numeric ranges are deliberately provisional. Record final values and captures. Never describe these ranges as extracted source constants.

Scrolling backward must exactly unwind the same overlap geometry; avoid timers, one-shot class toggles and directional branching that cause state drift. Fast wheel, scrollbar dragging, Home/End and direct navigation must converge to the correct stage without blank regions.

## Driver and lifecycle

Inspect `useScrollTimeline.ts` before reuse. Its continuous smoothing is externally driven by existing renderers. Removing the archive's WebGL loop means a new DOM stack cannot assume the old loop still drives it. Avoid altering shared hook behavior for the hero.

Use a section-local demand-driven requestAnimationFrame controller if needed. Read geometry on resize/scroll in batches, calculate once, then write transform/opacity properties through refs or CSS variables. Do not set React state on every frame or perform layout reads after each write.

For smoothing, use delta-time-aware convergence, e.g. alpha = 1 - exp(-dt/tau), then stop near the target. Reset/clamp elapsed time after backgrounding. Keep a small enough tau that scrolling feels direct. Disconnect observers/listeners and cancel scheduled frames on unmount; idle/offscreen/paused state should not run a perpetual animation loop.

Prefer transforms and opacity. Limit `will-change` to the active/nearby layers. Do not blur the entire stack or use animated box-shadow filters on every card. Content must render in SSR HTML; browser animation is progressive enhancement.

## Handoffs, small screens and motion preferences

Intro timing stays unchanged. Cards enter in their own document flow after the dive; use a modest scoped tonal boundary if necessary to avoid a startling full-screen white flash. The final card holds briefly in scroll distance and then the stage unpins naturally into `NoirCinematic`. Do not create another tunnel or globally translate the page. Final release is a proposed adaptation, not visible evidence.

Mobile original behavior is unverified. Provide a deliberate adaptation: single-column cover above copy, generous touch controls, natural card height, no clipped descriptions. If sticky cards cannot fit the usable viewport (including landscape/zoom), use a normal vertical list. Choose the breakpoint from available space rather than claiming an observed original breakpoint.

With `prefers-reduced-motion`, show a stable document-flow list; no zoom/lean/scrub transition required to read content. A section pause control may use existing `noir-motion-paused` preference. Paused mode must keep every card reachable, preferably via the same stable list, and preserve the reading anchor when toggled. Never freeze a stacked state that hides older content with no way to reach it.
