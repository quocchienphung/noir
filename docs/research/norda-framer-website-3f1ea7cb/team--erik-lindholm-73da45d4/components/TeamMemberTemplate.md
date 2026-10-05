# TeamMemberTemplate (shared by the nine `/team/<slug>` entries)

- **Identity:** `src/app/team/[slug]/page.tsx` → `shared/templates/TeamMemberTemplate.tsx` · `team-member.module.css` · data `team.ts` · evidence `raw/team--*/`, `tools/`: `strong*.mjs`, `inter.mjs` (Inter 700 year prefixes).
- **Structure:** dark `main#main-container` → portrait (Columns main) with name + role overlaid bottom-left (tablet/desktop) and a SCROLL link to `#main-container` → bio lead → Education and Recognition groups (`/  Education`, year prefixes `2012: ` in **Inter 700**, entries `pre-wrap`) → "Meet the Team →" (`ArrowLink md` + `mdPhoneLarge`) to `/about#meet-the-team`.
- **Layout (M):** portrait and name block 100vh on desktop, 640px tablet, 400px phone; tablet name block padding-bottom 112; phone name/role padding 48 24 64; group paragraph gap 20.
- **Unicode slugs:** `linnea-sörensen`, `oskar-bjørnsen`, `elin-jørgensen`, `sofia-bergström` are preserved; `routes.ts` encodes them and `decodeSlug` normalises to NFC.
- **Acceptance:** `qa-routes` (9 × 3 widths), deep link `/team/erik-lindholm#main-container` in `qa-behaviors`, viewport-height variance Δ ≤ 2px (700/1100).
