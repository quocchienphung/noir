# `/privacy-policy` — page topology (page key `privacy-policy-81e51d8c`)

Route file `src/app/privacy-policy/page.tsx`; content `privacy.ts`. Evidence: `raw/privacy-policy-81e51d8c/`.

| # | Section | Component | Notes |
| --- | --- | --- | --- |
| 1 | Header: display "Privacy Policy" in a 50vh white block | inline | static |
| 2 | Intro row "/  00" + title-size lead | inline | three-column rule (number · content · side) |
| 3 | Sections "/  01" … "/  09": heading + `RichText` (paragraphs, disc bullets, bold email) | `RichText bullets="disc"` | one authored blank line kept (`\n\n`) as on the source |
| 4 | Footer | `SiteFooter` | — |

Behaviors: static page; links roll on hover; no anchors or interactive content beyond the footer (M). Visual frames: mismatch ≤ 1.42% at all widths.
