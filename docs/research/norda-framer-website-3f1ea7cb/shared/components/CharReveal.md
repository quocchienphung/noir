# CharReveal — per-character text reveal

- **Identity:** `/` intro heading + first testimonial, `/jobs/*` title + quote · `shared/CharReveal.tsx` · `char-reveal.module.css` · evidence: `tools/` `splitscan.mjs` (all routes × 1440/1024/390), `chartime.mjs`, `charstarts.mjs`, `charreplay.mjs`, `h1load2.mjs`, `spanav.mjs` (16ms rAF samples), 2026-10-05.
- **Structure:** the host element (`h1`/`h2`/`p`/`figcaption`) holds one visually hidden full string plus an `aria-hidden` copy split into nowrap word spans of inline-block glyph spans (same structure as the source: glyph `inline-block` inside an inline `nowrap` word).
- **Instances (M):**

| Where | Mode | Delay | Breakpoints with the effect |
| --- | --- | --- | --- |
| `/` "Nordå — / an architecture and design studio…" | line | 0 | desktop |
| `/` first testimonial quote | line | 0.4s | desktop |
| `/` first testimonial author | line | 0.8s | desktop |
| `/jobs/*` H1 title | char | ≈1.4s after mount | desktop + phone |
| `/jobs/*` quote | line | 0.2s | desktop + tablet |

- **Motion:** line mode — glyph opacity 0 → 1 and translateY 60px → 0 over 1s, 100ms stagger per rendered line (lines recomputed with a ResizeObserver). Char mode — 30px → 0 over 0.4s, 50ms stagger per glyph. Curve: critically damped spring 1 − (1+ωt)e^(−ωt) (ω ≈ 9.3 s⁻¹ for line mode) expressed as CSS `linear()`; the fit matched the source's 50% and 99% points within one frame (I for the model, M for timings).
- **Trigger:** line mode fires once when the block's top touches the viewport bottom (IntersectionObserver, edge-inclusive — M: it fired at top = 900 in a 900px viewport, not at 905); never replays (M). Char mode fires once per mount.
- **Breakpoint gating:** where the source has no effect, glyphs render `display: inline` with no transform, i.e. as plain text.
- **Accessibility:** one readable copy; `prefers-reduced-motion` shows text immediately; `<noscript>` style in `SiteShell` un-hides glyphs without JavaScript.
- **Acceptance:** `qa-behaviors` "char reveal: …" (title 0 → 1 after load on desktop, static on tablet, intro hidden until scrolled into view, static under reduced motion). Local vs reference start/half times per line within 10–25ms (`charstarts.mjs`), client-navigation title start 1.50s vs 1.50s.
- **Uncertainty:** on a hard load our title starts ≈0.2s earlier than the source (1.63s vs 1.86s after navigation start) because hydration is faster locally; the delay is tied to mount, matching client navigation exactly.
