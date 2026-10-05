# AboutSection + Counters

- **Identity:** `/` · `root-8a5edab2/AboutSection.tsx`, `Counters.tsx` · `root-8a5edab2/about.module.css` · evidence `raw/root-8a5edab2/compact-*.txt`, `tools/`: `counter.mjs`, `counter-0…7.jpg`, `splitscan.mjs`, `chartime.mjs`.
- **Structure:** Columns (plus) → `h2` intro heading ("Nordå — " / "an architecture and design studio based in Stockholm.", `CharReveal`) + body `p`; counters: two rows of two items, each a hairline + `p` (visually hidden "15 Years" etc., aria-hidden figure and label); studio `ParallaxImage`; leadership copy (founder names bold) + `ArrowLink lg` "About" → `/about`.
- **Content:** counters 15 Years, 44 Projects, 8 Awards, 32 Clients (final values read after the animation completed — M; the initial 0 is only the animation start).
- **Assets:** studio image `LE3rjd9zpvakgOKhWeExVQ2s`.
- **Layout/typography (M):** heading preset (64/70.4 · 50/55 · 40/44); body 18/28.8; counter figures with `tnum`/`zero`; label preset under the figure; row lines `rgba(0,0,0,.1)`.
- **State machine:** counter row progress p ∈ [0,1]; figure text switches from 0 to the final value once p ≥ 0.3 and stays.
- **Motion:** desktop: 50vh trigger centred on each row maps scroll to p; block translateY from −(100% + 53px) to 0 (M). Tablet/phone p = 1 (M). Intro character reveal: see `shared/components/CharReveal.md`.
- **Input:** scroll only.
- **Accessibility:** one readable copy per counter ("15 Years"); animated digits aria-hidden.
- **Acceptance:** `qa-behaviors` "reduced motion: counters final" + "char reveal: home intro…"; `compare/1440-y900.jpg`, `y1800`.
- **Uncertainty:** the source counts with a jump rather than a tween (M from samples); exact threshold 30% is M ± one 100ms sample.
