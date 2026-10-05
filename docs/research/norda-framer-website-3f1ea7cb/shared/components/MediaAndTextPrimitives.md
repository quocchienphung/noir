# Media and text primitives (shared spec)

One spec for small reusable primitives; each line lists file, measured rules and acceptance evidence.

## ParallaxImage (`shared/ParallaxImage.tsx`, `parallax.module.css`)
- Frame with `overflow: hidden`, inner media 300px taller, translateY −300px → 0 as the frame travels through the viewport (M, `plx.mjs`: identical offsets at 1024 and 1440 for the /about image at three scroll positions).
- White "+" corner markers inset 64 / 48 / 24 (desktop / tablet / phone); optional overlay slot (rotating badge, link text).
- `next/image` with local `src`; `sizes` comes from `coverSizes(asset, width, height, "300px")` (`lib/sites/<site>/media.ts`): per breakpoint `max(box width, (box height + overscan) × image aspect)`, because a cover crop in a tall box needs more pixels than the box width (before this fix phone covers were upscaled up to ×4; `underres.mjs` now reports 0 upscaled images on every template at 1440/1024/390). Reduced motion → static.

## HalfSpeed (`shared/HalfSpeed.tsx`)
- Content translateY = scroll × 0.5 while the header is in view (hero, page headers) (M from scroll frames).

## FitText (`shared/FitText.tsx`, `fit-text.module.css`)
- SVG `viewBox` + `foreignObject` paragraph at the source's font size, tracking and line height; scales with its box.
- `clip`: the SVG keeps its viewBox ratio at full width, anchored top-left inside a shorter box with `overflow: hidden` — used by the home video statement (box ratio 2.7772 desktop / 334px tablet; SVG 1312×536 at 1440, M).
- `align="center"`: "MEET THE TEAM" (M: centred lines, Albert 900).

## PageHeader (`shared/templates/PageHeader.tsx`, `page-header.module.css`)
- 100vh image header, intro (`text-indent: calc(20% + 16px)`, M on all four headers at all widths), 66%-wide fit-text title (phone 66% or full width for About), "SCROLL" link to `#main-container` (tablet+).
- Title SVG centred on its box, nudged by `offsetX` (Projects −2%, News −3%); viewBox width per breakpoint because tracking is −0.07 / −0.06 / −0.05em. Verified: SVG rects equal the reference at 1440 / 1024 / 390 for all four pages (`fitsvgs.mjs`).

## ArrowLink (`shared/ArrowLink.tsx`, `arrow-link.module.css`)
- Underline drawn by an inset `::after` border (box = one line tall, M). Sizes: `lg` 64/76.8 · 50/60 · 40/48 (arrow 52/40/32); `md` 36/43.2 Albert 500 · 32/38.4 variable 500 · 28/33.6 variable 500 (arrow 32/28/24). `mdPhoneLarge` keeps 36/43.2 on phones ("Meet the Team" on team pages, M).

## RecordList (`shared/RecordList.tsx`, `record-list.module.css`)
- Hairline rows (Awards, Archive Projects, Publications). Phone stacked (pad 32, gap 24); tablet title over meta (pad 40, gap 16); desktop one row of two halves, 64px gap. Count label "/  8".
- Desktop appear: title y 30 → 0; list (or each Publications row) y 100 → 0 + opacity, 1s, replays on re-entry (M).

## Ticker (`shared/Ticker.tsx`, `ticker.module.css`)
- "Nordå Architects ~" repeated, CSS keyframe loop at ≈101px/s leftward (M); hidden on phone in testimonials.
- Band position is relative to its section (M at 700/900/1100 viewport heights): centre at 27.14% (testimonials) and 33.93% (job quote) of the section height, via `--nd-ticker-center`.

## RichText, JobList, ArticleCard, Columns, icons
- RichText: `{bold}` runs, `\n` → `<br>`, dash or disc bullets, paragraph gaps 24 / 20 (education).
- JobList: rows with title, summary, location/type, arrow; gap 8 (phone).
- ArticleCard: 50vh parallax cover (READ ARTICLE cursor on the image frame only, `tabIndex -1` duplicate link), date, heading-size title, excerpt, `md` "Read Article" link; info padding 32 / 56 / 64.
- Columns: 1 : 2 : 1 flex rule with padding per breakpoint (see `DESIGN_TOKENS.md`).
