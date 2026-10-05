# Nordå reconstruction — progress

Site key `norda-framer-website-3f1ea7cb` (`sha256("https://norda.framer.website")[:8]` = `3f1ea7cb`). Root page key `root-8a5edab2`.
Last updated 2026-10-05.

## Status: complete (all gates), with the documented gaps in `QA_REPORT.md`

## Done

- Preflight: Node 22.14 / npm 10.9 (package declares Node ≥ 24 — engines warning only), `npm ci`, baseline build. No browser MCP in this session; Playwright driving system Chrome was used for all inspection and QA.
- Route graph closed: 31 routes (30 sitemap URLs + linked `/404`) — `ROUTE_MANIFEST.json` (all `done`), `raw/crawl.json`.
- Assets: 84 original files (74 images, 1 video, 1 vector, 8 fonts) downloaded once with signature + sha256 validation — `ASSET_MANIFEST.json`, `scripts/download-assets-…mjs`, `scripts/generate-asset-map-…mjs`.
- Foundation: local fonts, tokens, three-column rule, chrome + drawer menu, roll text, cursor follower, footer reveal, shared rAF scroll scheduler.
- All 31 routes implemented with real components, local destinations and typed data (see `OUTPUT_PLAN.md`, `COMPONENT_INVENTORY.md`).
- Fidelity passes on 2026-10-05: tablet/phone link typography (md links, footer sitemap), inset underlines, per-character reveals (4 instances, timing within 10–25ms), FitText clipping/alignment, page-header text indent + per-breakpoint title viewBoxes/offsets, badge sizing, contact image, 80vh / 100vh / 360vh viewport-relative heights (verified at 700 / 900 / 1100px viewports), project stack (sticky 160px, last card shrinks under the archive), percentage ticker positions, cover-aware image `sizes` (0 upscaled images), non-breaking spaces, home-only scroll margin, cursor zones from the source's Framer cursor map (incl. desktop-only zones), job-row and team-card hover, testimonial quote widths, tablet team grid, desktop-only hero "Apply Now".
- QA: `tests/qa-routes.mjs`, `tests/qa-behaviors.mjs`, `tests/qa-independence.mjs`, `tests/qa-visual.mjs` (+ `npm run qa:*` scripts) run against the standalone production build.
- Docs: `OUTPUT_PLAN.md`, `DESIGN_TOKENS.md`, `COMPONENT_INVENTORY.md`, `ANIMATION_INVENTORY.md`, `shared/components/*`, per-page `PAGE_TOPOLOGY.md` / `BEHAVIORS.md` / `components/*` for every page key, `QA_REPORT.md`, `tools/` (probe scripts + outputs).

## Active

- None.

## Blockers

- None. Known differences are listed and ranked in `QA_REPORT.md`.

## Next actions (optional)

- Safari check (Chrome fully tested, Firefox smoke-tested; CSS `linear()`, `max()` in `sizes`, container query units are used).
- Phone-width cursor zones were not compared (touch devices hide the follower).
- If desired, add spring smoothing to the project-stack shrink to match the source's slight lag.

## Useful commands

- `npm run dev` → <http://localhost:3000> · `npm run check` (lint + typecheck + build)
- Production/standalone: `npm run build`, copy `.next/static` → `.next/standalone/.next/static` and `public` → `.next/standalone/public`, then `PORT=3200 HOSTNAME=127.0.0.1 node .next/standalone/server.js`
- QA (server must be running): `npm run qa:routes -- http://127.0.0.1:3200`, `npm run qa:behaviors -- http://127.0.0.1:3200`, `npm run qa:visual -- http://127.0.0.1:3200 1440,1024,390`, `npm run qa:independence` (after a build)
