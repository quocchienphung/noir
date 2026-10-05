# Testimonials

- **Identity:** `/` · `root-8a5edab2/Testimonials.tsx`, `shared/Ticker.tsx`, `shared/CharReveal.tsx` · `testimonials.module.css` · evidence `tools/`: `slide.mjs testi`, `testichar.mjs`, `testinames.mjs`, `testi-mt.jpg`.
- **Structure:** `section[aria-roledescription=carousel][aria-label=Testimonials]` → ticker band → viewport → track of 6 `li` (loop clones) each `figure` (blockquote quote, figcaption author) + portrait; arrows "Previous/Next testimonial"; dots; polite live region "Testimonial n of 4".
- **Content (M, order as rendered first):** Anna Lindström (Property Owner) · Johan Eriksson (Homeowner) · Ingrid Dahl (Family Home Owner) · Lars Nyberg (Vacation Property Owner) — strings in `home.ts`.
- **Layout (M):** section 100vh / 80vh / 720px; ticker band 200px tall centred at 27.14% of the section height (144px at 900, 95px at the 720px tablet section), hidden on phone; desktop slide padding 64, quote bottom-left, 280×772 portrait in the second quarter; 64px arrows bottom-right; dots on tablet/phone.
- **State machine:** same loop slider as the hero (`useLoopSlider`, 4 slides). Slide 1 quote spans the column; slides 2–4 wrap in 90% of it (562 / 542 / 308px, M — fixed 2026-10-05 after the `testimonial-2` capture showed different wraps).
- **Cursor zones (M):** section "none" (arrows, dots), slides "dot".
- **Motion:** slide 1.2s fitted ease (I); ticker ≈101px/s (M); first slide quote/author character reveal on entering view (desktop; delays 0.4s / 0.8s; per-line 100ms) — measured local vs reference start times 453/438ms and 853/842ms.
- **Input:** arrows (desktop), dots + swipe (touch).
- **Accessibility:** inert non-current slides, live status, labelled controls.
- **Acceptance:** `qa-behaviors` "testimonials: next / previous"; `compare/*` frames near the page end.
- **Uncertainty:** only slide 1 is split into characters on the source (M) — other slides are plain text and do not animate.
