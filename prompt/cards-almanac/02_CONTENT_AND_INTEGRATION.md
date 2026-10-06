# Cards Almanac — source integration and demo authoring

## Current page and exact replacement

At inspection, `src/app/page.tsx` renders:
`NoirIntro → NoirTesseract → NoirCinematic → NoirServices → NoirProcess → NoirPrinciples`.

Change only the middle archive position to `NoirCardsAlmanac`. The wormhole and tesseract are BOTH owned by `NoirTesseract`/`TesseractCanvas`; changing room appearance while leaving the wormhole active is insufficient. The replacement is a DOM card section, not a shader skin on the archive.

Inspect these before editing:

- `src/components/noir/NoirTesseract.tsx`, `TesseractCanvas.tsx`.
- `src/lib/noir/tesseract/{timeline,renderer,world,navigator,path,wormhole,wormholeShaders}.ts`.
- `src/styles/noir/tesseract.module.css`.
- `src/data/noir/tesseract.ts`, `src/data/noir/site.ts`.
- `src/components/noir/useScrollTimeline.ts`, `NoirIntro.tsx`, `NoirCinematic.tsx`.
- Relevant archive, route, scroll, orbit and visual QA in `tests/` and actual `package.json` scripts.

Retire archive-only room travel, past/present/future navigation, room docks, `archive` query handlers, `archiveFixture` activation and `window.__archive` from the home-page runtime. Search usages before removing shared utilities or old files. Do not remove unrelated experiment routes solely because their name resembles the archive. No hidden canvas, archive RAF, WebGL allocation or stale scroll lock should survive the replacement.

If existing links deep-link to archive rooms, migrate those meaningful links to stable card anchors or provide a documented compatibility mapping. Do not keep the entire 3D renderer to preserve an obsolete query parameter. Remove unused imports and update the page sequence comment accurately.

## Preserve real content

The old archive carries the canonical `home.capabilities` content from `src/data/noir/site.ts`. Preserve its eyebrow, title, body and six pillars (Frontend, Backend, Cloud, DevOps, Automation, APIs) once in a compact semantic introduction to the cards, plus the existing appropriate CTAs. Tune header size/line wrapping so this longer NOIR content fits the reference's hierarchy. Do not put the entire six-pillar capabilities layout on every card or make a giant overlay hide the stack.

Use the existing project metadata as the initial gallery. Currently there are two actual NOIR experiments, `event-horizon-renderer` and `this-site`, plus a reserved `open-slot` in archive data. Their real titles, summaries and internal links are the source of truth. Label these as NOIR experiments/templates, not commissioned client work. A year already in the source may be reused; do not invent dispatch dates or a copied 2025 eyebrow.

Default to one card per project, plus one clearly reserved demo slot if retaining it is useful. Do not mechanically produce nine nearly identical past/present/future cards. Preserve authored temporal snapshot metadata in the migration if present, but the old temporal-room controls are retired. If the source changed after inspection, use its actual authored entries and record the migration.

The public video has six art cards; this repository does not have six real portfolio projects. Test stack scalability with an explicitly labeled dev fixture of six cards. Production must not silently present test projects as real work.

## One typed authoring file

Suggested files: `src/data/noir/cards-almanac.ts`, `src/components/noir/NoirCardsAlmanac.tsx`, small detail component if necessary, and `src/styles/noir/cards-almanac.module.css`. Match repository conventions and strict TypeScript; no `any`.

Keep one documented array/config with stable project ID, title, summary, category, genuine date/year or null, cover or null, optional real internal href, and ordered demo-section slots. Preserve empty/template/live readiness distinctions when migrating useful slots.

Each slot should carry a stable ID, label, readiness, actual description/body, preview asset or null, live URL or null, section anchor or null, and an explicit framing policy where needed. Keep metadata out of animation code. Adding a demo must not require changing transforms or shader logic.

Website preview assets should show the author's actual site; add provenance if assets are added. Do not crop the reference's art covers and pretend they are website previews. Existing project screenshots may be used only if they correspond to that project. Until supplied, display a refined intentional placeholder labeled “Preview coming soon” / “Demo slot available”, not broken images or fake screenshot thumbnails. Placeholder graphics may be code-generated decorative color fields, clearly not screenshots. Keep the left square cover geometry even when empty.

Live URLs are currently absent in the authored slots. Keep them null. Existing internal project links remain useful navigation, but an internal link alone does not become an iframe-ready external live demo. Document exactly where the user can add cover/URL/sections later.

## Plus control — proposed NOIR behavior

The public clip shows a plus button but no activation. Implement the following adaptation; do not claim it reproduces an observed source click behavior.

The black circular plus is a real button with an accessible project-specific name (“View details for …”). It opens a focused project-detail dialog containing the existing project explanation and named demo section slots. Use the installed accessible dialog primitive if appropriate; maintain focus trapping, Escape, close control and focus restoration. Avoid expanding card height mid-scrub, which would destabilize the stack geometry.

An empty slot shows its clear reserved state. A template shows the real NOIR copy and any valid internal link. A live slot shows the author-supplied link and an explicit user action to open the demo. No click should go nowhere silently.

If live embedding is implemented, load at most one iframe after the user requests it. Closing or switching removes the previous embed. Use a titled frame and choose permissions from the actual demo requirements; do not blindly copy the old sandbox. Do not iframe this same home page recursively. For third-party content, avoid treating sandboxed unknown code as trusted same-origin code.

Honor explicit `embeddable: false` by offering an external link. For blocked framing, cross-origin errors may not be reliably observable: always provide an “Open demo in a new tab” fallback. Never claim that a timeout proves X-Frame-Options blocking. No autoplay of external content. Controls inside an embed must not drive the outer card stack.

## Navigation and theme

Cards need stable IDs/anchors so “Explore work” and keyboard navigation can reach useful content. Do not change the intro CTA's intended route without inspecting current data. Keep all real routes, contact actions and footer working.

GetLayers reference colors are light. Use local CSS tokens; do not recolor global NOIR styles or modify black-hole shaders to match the gallery. Check the actual fixed header over ivory. A narrowly scoped header contrast state is acceptable only if necessary, with no changes to its hero/Complexity state.

No new global smooth-scroll handler, wheel prevention, drag-to-orbit feature, forced pointer lock or route reload is needed for this section. Preserve the approved hero's interaction ownership. If pause preference is shared, maintain its semantics and cleanup; do not replace the black-hole controller.
