# HomeHero

- **Identity:** `/` · `root-8a5edab2/HomeHero.tsx`, `hooks/useLoopSlider.ts` · `root-8a5edab2/hero.module.css` · evidence `raw/root-8a5edab2/compact-*.txt` (Hero subtree), `tools/`: `hero.mjs`, `slide.mjs`, `hero-br.jpg`, `hero-mt.jpg`.
- **Structure:** `section[aria-roledescription=carousel]` → viewport → `ul` track of 5 `li` (clone of last, 3 slides, clone of first; `aria-roledescription=slide`, non-current `inert`) each with a full-bleed image link (cursor VIEW PROJECT), number "01 — 03", name, "View Project →" link; static logo mark; `h1` wordmark image (visually hidden "Nordå"); arrows; dots `role=group` with `aria-pressed`.
- **Content:** Verve Tower → `/projects/verve-tower`, Harbor 12 → `/projects/harbor-12`, Nordic One → `/projects/nordic-one` (M).
- **Assets:** `zSsaQ6aEIDDticuNpIL0PHy0OKE`, `EotxlpqJ6kEJA2rkEI4NgwSi4tE`, `quoHgFIveHXEyv49z3HoccYb9E` (slides), wordmark SVG, back/next arrow PNGs `Ih46Mq8uiQ56rQhTIyUJTvfIXE` / `H3BmhpWcSqVQg81DVbYo0lExgDU` — see `ASSET_MANIFEST.json`.
- **Layout (M):** 100vh. Desktop: wordmark row 3:1 with 64px gap, padding 0 64 64; info column right-aligned at the wordmark top; 64px arrow buttons 64px from bottom/right, 8px apart. Tablet: wordmark full width, 48px gutter; link + info row 200px above the bottom; dots 96px from the bottom. Phone: wordmark at top 120, info under it, link 200px above the bottom, dots 96px from the bottom.
- **State machine:** `pos` ∈ 0…4 (1…3 real). Next/prev/dot → animate to the target; on transition end at a clone, jump without animation to the real slide. Active dot = real index.
- **Motion:** translateX(−pos × 100%) over 1.2s `cubic-bezier(0.22,1,0.36,1)` (I fit of the sampled trajectory); content half-speed on scroll (M).
- **Input:** click arrows (desktop), dots (touch breakpoints), touch/pen swipe > 40px; mouse drag ignored; keyboard via buttons.
- **Accessibility:** labelled carousel, slide labels "n of 3", hidden clones, inert off-screen slides, button labels "Previous project" / "Next project" / "Show <name>".
- **Acceptance:** `qa-behaviors` "hero: next / previous / wrap-around" (1440) and "hero: dots + swipe on phone" (390); `compare/*-y0.jpg`.
- **Uncertainty:** the source slideshow is a Framer spring; the cubic-bezier is a fitted stand-in (I). No autoplay was observed during inspection (O).
