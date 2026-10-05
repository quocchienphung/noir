# NOIR visual tokens

Defined on `.shell` in `src/styles/noir/shell.module.css`. Global `--background`/`--foreground` in
`src/app/globals.css` match them, so every route is dark (`color-scheme: dark`).

## Colour

| Token | Value | Use |
| --- | --- | --- |
| `--noir-bg` | `#050505` | page ground |
| `--noir-bg-raised` | `#0c0c0c` | cards, inputs, drawer |
| `--noir-surface` | `#121212` | reserved for elevated panels |
| `--noir-text` | `#f4f1ea` | warm ivory text, primary buttons |
| `--noir-muted` | `rgb(244 241 234 / .64)` | body copy |
| `--noir-faint` | `rgb(244 241 234 / .50)` | eyebrows, meta, legal |
| `--noir-line` | `rgb(244 241 234 / .10)` | hairlines |
| `--noir-line-strong` | `rgb(244 241 234 / .22)` | input borders, tags, ghost buttons |
| `--noir-accent` | `#f2a65a` | disk-gold accent, used sparingly (status rule, header glow) |
| `--noir-danger` | `#ff8a7a` | invalid fields |

Contrast on `#050505` (computed): ivory ≈ 18:1, muted ≈ 7.6:1, faint ≈ 4.9:1 (all AA for body-size text).

## Type

Albert Sans (OFL), self-hosted from `public/sites/noir/fonts/`. The variable file is used for body
copy, and the 500/600/700 cuts for display type and labels.

| Role | Size | Weight / tracking |
| --- | --- | --- |
| Intro headline | `clamp(2.6rem, 7.1vw, 7.5rem)`; phone `clamp(2.35rem, 11.6vw, 4.25rem)` | 500 / −0.055em, lh 0.95 |
| Cinematic statement | `clamp(2.4rem, 7.4vw, 7rem)`; phone `clamp(2.25rem, 12vw, 3.5rem)` | 500 / −0.05em |
| Page title | `clamp(3rem, 9vw, 8.5rem)` | 500 / −0.055em |
| Display (section) | `clamp(2.1rem, 5.4vw, 5rem)` | 500 / −0.045em |
| Heading | `clamp(1.9rem, 3.6vw, 3.4rem)` | 500 / −0.04em |
| Lead | `clamp(1.0625rem, 1.4vw, 1.25rem)`, lh 1.6 | 400 |
| Eyebrow / gauge | 0.75rem mono, uppercase, +0.14em | 400 |
| Wordmark "NOIR" | 0.9375rem | 600 / +0.26em |

## Space and layout

- Gutter `--noir-gutter`: 1.25rem (phone), 2.5rem (≥ 810 px), 4rem (≥ 1200 px).
- Section rhythm `--noir-section-y`: 6 / 8 / 10rem. Max content width 90rem.
- Header height 4rem / 4.5rem. It is fixed, z-index 40, and turns to glass (`rgb(5 5 5 / .62)` + 14 px
  blur + hairline) after 24 px of scroll. The drawer is z-index 50.
- Breakpoints 810 px and 1200 px (inherited from the previous site's grid).
- Radii: 0.25rem for controls, 0.5rem for cards, 999px for tags.

## Motion

- Header/drawer: 0.35–0.6 s, `cubic-bezier(.22,1,.36,1)` for entrances and `(.65,0,.35,1)` for the
  drawer wipe.
- Section reveals use CSS scroll timelines only (`animation-timeline: view()`). Without support, or
  with reduced motion, content is simply visible.
- Scroll scenes: see `SCROLL_TIMELINE.md`.

## Black-hole looks (`src/lib/noir/blackhole/scenes.ts`)

| | Dive (`DIVE_DISK`) | Cinematic (`CINEMATIC_DISK`) |
| --- | --- | --- |
| Disk radii | 2.75 → 17 rs | 2.9 → 15 rs |
| Hot / warm / cool | `1,.70,.34` / `1,.38,.05` / `.60,.10,.015` | `1,.93,.84` / `1,.60,.27` / `.50,.17,.045` |
| Doppler mix | 0.42 | 0.95 (approaching side clearly brighter) |
| Flow | +1.25 | −0.8 (left side approaching, as in the reference) |
| Exposure / bloom | 1.0 / 0.4 above threshold 0.8 | 1.0 / 0.3 above threshold 1.0 |
| Tonemap | 60 % hue-preserving + 40 % ACES, gamma 2.2, vignette, 3.5 % grain | same, 3 % grain |
