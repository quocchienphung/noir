# Design tokens — Nordå

Source of truth in code: `src/styles/sites/norda-framer-website-3f1ea7cb/site.module.css` (scoped to `.site`).
Evidence: `raw/<page-key>/compact-{1440,1024,390}.txt` (computed-style dumps), `raw/<page-key>/appear-*.json`,
probe scripts listed in `QA_REPORT.md`. Labels: **M** measured · **I** inferred · **U** unknown.

## Breakpoints (M — Framer `__framer__breakpoints`)

| Name | Range | Gutter `--nd-gutter` | Section rhythm `--nd-section-y` | Column padding |
| --- | --- | --- | --- | --- |
| phone | 0–809.98px | 24 | 96 | main only, `0 24px` |
| tablet | 810–1199.98px | 48 | 144 | left side 24 · main `0 48px 0 24px` · right side hidden |
| desktop | ≥ 1200px | 64 | 192 | 32 on all three columns |

Three-column rule (M): side columns `flex: 1 0 0`, main `flex: 2 0 0`. A 12×12 "+" marker sits at the top-left of side columns.

## Colour (M)

| Token | Value | Use |
| --- | --- | --- |
| `--nd-white` | `#fff` | page panels, text on media |
| `--nd-black` | `#000` | text, footer, content layer, drawer |
| `--nd-gray` | `#777` | secondary labels, form underlines |
| `--nd-ink` | `#111` | dark pages (about, contact, team) |
| `--nd-backdrop` | `rgb(34,34,34)` at opacity 0.66 | menu backdrop |
| `--nd-line` | `rgba(0,0,0,0.1)` | hairlines (record lists, counters); Publications use 2px |

No shadows, rounded corners or gradients are used by the source (O).

## Typography

Families (M): **Albert Sans Variable** (body/title presets, variable axis file), **Albert Sans** static 400/500/600/700/900 + 500/700 italics (headings, labels, links), **Inter 700** (year prefixes on `/team/*` only). All served from `public/sites/<site>/shared/fonts/`.

| Preset | Phone | Tablet | Desktop | Notes |
| --- | --- | --- | --- | --- |
| body | 18/28.8 | same | same | variable face, `"wght" 450`; `<strong>` = `"wght" 700`; paragraph gap 24 (education lists 20, multi-paragraph lead 40) |
| title | 28/36.4 ls −0.56 | 32/41.6 ls −0.96 | 36/46.8 ls −1.44 | variable `"wght" 550`, features `blwf cv03 cv04 cv09 cv11` |
| heading | 40/44 ls −1.2 | 50/55 ls −2 | 64/70.4 ls −3.2 | Albert 500 + same features |
| display | 64/57.6 ls −2.56 | 96/86.4 ls −4.8 | 120/108 ls −7.2 | Albert 500 |
| label | 18/28.8 | same | same | Albert 700 uppercase |
| small | 14/22.4 | same | same | Albert 400 (true 400 face) |
| link md | 28/33.6 ls −0.28, variable `"wght" 500` | 32/38.4 ls −0.64, variable 500 | 36/43.2 ls −1.08, Albert 500 | "Read Article", "Apply Now", footer sitemap; arrow 24/28/32 |
| link lg | 40/48 ls −1.2 | 50/60 ls −2 | 64/76.8 ls −3.2 | Albert 500; arrow 32/40/52 |
| counters | — | — | — | `tnum`, `zero` features |

Framer text uses `white-space: pre-wrap`; page-header intros use `text-indent: calc(20% + 16px)` (M, all breakpoints).
Underlines are a 1px bottom border on an inset `::after`, so link boxes are exactly one line tall (M).

Fit-text titles (M) are SVGs with fixed viewBoxes; tracking −0.07em / −0.06em / −0.05em (desktop / tablet / phone) gives a distinct viewBox width per breakpoint. Projects and News titles are nudged −2% / −3% of the box width.

## Layers (M)

| Layer | z-index / order |
| --- | --- |
| Footer (revealed underneath) | below content |
| Content layer `.content` | 3, black |
| Page panels (`main`) | 1–2 within content |
| Fixed logo + MENU | above content (mix-blend on light panels after reveal) |
| Menu overlay (backdrop + drawer) | top |
| Cursor follower | top, `pointer-events: none` |

## Motion tokens

| Token | Value | Evidence |
| --- | --- | --- |
| `--nd-ease-inout` | `cubic-bezier(0.44, 0, 0.56, 1)` | M — Framer appear JSON |
| `--nd-ease-slide` | `cubic-bezier(0.22, 1, 0.36, 1)`, 1.2s | I — fitted to sampled slideshow trajectory (Framer spring) |
| `--nd-spring` (char reveal) | `linear()` sampling 1 − (1+ωt)e^(−ωt), ωt = 9.3 at the end | I — critically damped fit to 16ms samples; durations 1s (line) / 0.4s (char) |
| roll text | 300ms per glyph, 35ms stagger, no reverse | M |
| ticker | ≈101px/s leftward | M |
| rotating badge | 8s per turn, counter-clockwise | M |

Complete per-effect records: `ANIMATION_INVENTORY.md`.

## Responsive observations (O/M)

- Menu drawer width 100% / 67% / 33%; links 40 / 50 / 64px.
- Logo 70×30 / 84×36 / 100×43 at 24 / 48 / 64px offsets.
- Desktop-only scroll choreography: counters slide, video frame scale, footer reveal parallax, team scatter, project stack shrink. Tablet/phone render the settled state.
- Character reveals: home intro + first testimonial desktop only; job title desktop + phone; job quote desktop + tablet.
