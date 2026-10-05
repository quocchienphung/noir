# `/` — behaviors

Labels: M measured · I inferred · U unknown. Full timing records in `../ANIMATION_INVENTORY.md`.

## Scroll sweep (1440 / 1024 / 390)
- Hero content moves at half speed; the white main container scrolls over it (M).
- Logo appears and MENU switches to blend mode once `<main>` reaches the top (M).
- Intro heading: per-character reveal, 100ms per line, desktop only, once (M).
- Counters: desktop — number+label block slides from above the row to 32px below the line across a 50vh trigger; figures read 0 until 30% progress (M). Tablet/phone static (M).
- Studio, services and article images: −300px → 0 parallax (M).
- Video stage (desktop): 250vh; frame scale 0.66 → 1 and video scale 1.2 → 1 over the first 50vh, wave mark opacity 1 → 0; white statement sticky; Awards panel then covers it (M). Tablet/phone: full-bleed video, statement at the bottom, no scaling (M).
- Awards (desktop): title rises 30px, list rises 100px + fades in, 1s, replays on re-entry (M).
- Footer (desktop): reveal from −480px with the wordmark fading to 0.12 (M).

## Click / keyboard sweep
- Hero: Previous/Next arrows (desktop), dots (tablet/phone), swipe ≥ 40px with touch or pen (mouse drags ignored); loops in both directions; 3 slides (Verve Tower, Harbor 12, Nordic One) each linking to its project (M).
- Services accordion: each step toggles independently; "+" → "−"; panel height eases open ~0.48s (M states, I curve); Enter/Space via the native button.
- Testimonials: arrows (desktop) / dots (touch) / swipe; 4 slides; no autoplay (M). Only slide 1 has the character reveal (quote 0.4s, author 0.8s, desktop) (M).
- "About →", "Read Article →", footer links: local navigation.

## Hover sweep (fine pointer)
- Links and buttons: roll-text glyph animation on enter, no reverse (M).
- Hero/project images → VIEW PROJECT label; article image → READ ARTICLE; award rows → the award's preview image (33vh) follows the pointer; accordion rows → dot (M).

## Responsive sweep
- Hero: desktop wordmark row + right info column + arrows; tablet wordmark full width, dots 96px from bottom; phone wordmark at top 120 (M).
- Partners: desktop/tablet two rows of four; phone two columns (M).
- Testimonials ticker hidden on phone (M).

## Not observed
Autoplay, page transitions, smooth-scroll library, scroll snapping.

## Verification
`tests/qa-behaviors.mjs` (hero, accordion incl. keyboard, testimonials, char reveal, reduced motion, cursor), `tests/qa-visual.mjs` frames in `design-references/<site>/root-8a5edab2/compare/`.
