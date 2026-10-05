# `/news` — page topology (page key `news-f46b16ed`)

Route file `src/app/news/page.tsx`. Evidence: `raw/news-f46b16ed/`, `design-references/<site>/news-f46b16ed/`.

| # | Section | Component | Layer / flow | Interaction model |
| --- | --- | --- | --- | --- |
| 1 | Page header ("News", offset −3%, intro with text-indent) | `PageHeader` | flow, half-speed | anchor link |
| 2 | Main `#main-container` | `InnerMain` | over the header | — |
| 2a | Six article cards (gap 96 / 144 / 192) | `ArticleCard` ×6 | flow | parallax covers, cursor READ ARTICLE, links |
| 3 | Footer | `SiteFooter` | revealed | — |

Listing order and titles come from `articles` in `news.ts`; card titles differ from slugs on the source (e.g. "Exploring the Future of Urban Living" → `/news/how-architecture-shapes-productivity`) and are kept as observed.
