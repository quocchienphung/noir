# ArticleTemplate (shared by the six `/news/<slug>` entries)

- **Identity:** `src/app/news/[slug]/page.tsx` → `shared/templates/ArticleTemplate.tsx` · `article.module.css` · data `articles` in `news.ts` · evidence `raw/news--*/`, `tools/`: `artbody.mjs`, `articles.json`.
- **Structure:** white `main` → intro (display title, Date + Reading Time row, excerpt) → framed `ParallaxImage` (80vh) → body Columns: two `h3` heading + paragraph sections separated by an empty paragraph (p +24px, h3 +40px) → "More News →" link to `/news`.
- **Content:** titles differ from slugs on the source and are kept (e.g. slug `how-architecture-shapes-productivity`, title "Exploring the Future of Urban Living"); document `<title>` stays "Nordå Architects" like the source.
- **Layout (M):** intro top padding 96 / 144 / 192.
- **Acceptance:** `qa-routes` (6 × 3 widths), heights Δ ≤ 2px; viewport-height variance Δ ≤ 1px at 700/1100.
