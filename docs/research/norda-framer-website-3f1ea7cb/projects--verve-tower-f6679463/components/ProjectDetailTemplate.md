# ProjectDetailTemplate (shared by the five `/projects/<slug>` entries)

- **Identity:** `src/app/projects/[slug]/page.tsx` → `shared/templates/ProjectDetailTemplate.tsx` · `project-detail.module.css` · data `projectDetails` in `projects.ts` · evidence `raw/projects--*/`, measured on verve-tower at 1440/1024/390 and re-checked on all five (heights Δ ≤ 2px).
- **Structure:** white `main` → 200px spacer → `h1` display title → hero `ParallaxImage` (preload) → description Columns (`dl` Location / Year, title-size lead, body paragraphs) → gallery (2–3 `ParallaxImage` in the main column) → closing lead + body → full-width "Next Project" link banner (cursor VIEW PROJECT) to the next entry (wraps from Ström Haus to Verve Tower).
- **Layout (M):** hero and gallery frames 80vh (all breakpoints); gallery gap 64 / 92 / 128; description padding 64 / 96 / 128; params row gap 64 (tablet) / 48 (desktop), param boxes min-width 160 (tablet) / 200 (desktop) and grow for long values such as "Copenhagen, Denmark"; next banner 50vh.
- **Motion:** parallax on every frame; the Next banner image parallaxes behind centred text.
- **Accessibility:** `dl` semantics for parameters; banner link text "Next Project <name>".
- **Unknown slugs:** `dynamicParams = false` → 404.
- **Acceptance:** `qa-routes` (all five × 3 widths), `qa-behaviors` "project detail: next-project link", `compare/` frames under each entry's page key.
