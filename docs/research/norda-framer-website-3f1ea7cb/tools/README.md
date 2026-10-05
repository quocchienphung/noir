# Research probes (provenance only)

Ad-hoc Playwright/Python scripts used during inspection and fixing (2026-10-04 → 2026-10-05). They are **not**
part of the app or the test suite (`tests/` holds the maintained QA scripts) and are kept so the measurements
quoted in the specs can be reproduced.

- Runtime: Node 22 + `playwright` driving system Chrome (`channel: "chrome"`); Python 3 for text utilities.
- Most scripts compare `https://norda.framer.website` with a local server (`http://localhost:3000` dev or
  `http://127.0.0.1:3200` production; some read `LOCAL` / `BASE` env vars). Paths starting with `/` must be
  passed with `MSYS_NO_PATHCONV=1` in Git Bash.
- `lib.mjs`, `crawl.mjs`, `batch.mjs`, `compact.mjs` produced `raw/` (crawl, DOM, computed-style dumps).
- Geometry: `anchors.mjs`, `boxes.mjs`, `heights.mjs`, `frameh.mjs`, `framescan.mjs`, `secth.mjs`, `fitsvgs*.mjs`, `crafting*.mjs`, `stack*.mjs`, `teampos.mjs`, `badge*.mjs`, `quoteband*.mjs`, `tickpos*.mjs`, `contactimg.mjs`, `plx.mjs`.
- Typography/text: `textcmp.mjs`, `linkin.mjs`, `linkcmp.mjs`, `hrefin.mjs`, `findtext.mjs`, `findnode.mjs`, `nodes.mjs`, `wraplines.mjs`, `wrapprops.mjs`, `indentscan.mjs`, `textdiff.mjs`, `meet*.mjs`, `texts.py`, `extlinks.py`.
- Motion: `splitscan.mjs`, `letters.mjs`, `chartime.mjs`, `charstarts.mjs`, `charreplay.mjs`, `h1load*.mjs`, `spanav.mjs`, `testichar.mjs`, `slide.mjs`, `counter.mjs`, `roll.mjs`, `rot.mjs`, `timing.mjs`, `wave.mjs`, `menu*.mjs`, `appear*.mjs`, `teamrate.mjs`, `teamhover.mjs`, `p404*.mjs`.
- Media: `imgres.mjs`, `underres.mjs`, `sizestest.mjs`, `logos.mjs`.
- Cursor zones and hover: `cursorids.py`, `cursortables.py` (read the Framer cursor map from the captured DOM / page modules), `cursormap.mjs`, `cursortree.mjs`, `zonegrid.mjs` (point-grid comparison), `ourcursor.mjs`, `variants*.mjs`, `dotshot.mjs`, `menudot.mjs`, `arrowhover.mjs`, `hovercmp.mjs`, `hovermeas.mjs`, `jobhover*.mjs`, `jobrest.mjs`, `teamrest.mjs`.
- `gendocs.mjs` generated the per-entry CMS `PAGE_TOPOLOGY.md` / `BEHAVIORS.md` files and refreshed `ROUTE_MANIFEST.json`.

## Probe outputs

- Text / JSON outputs (menu samples, appear maps, text diffs, probe dumps): `tools/output/`.
- Probe screenshots referenced by the specs (`counter-*.jpg`, `acc.jpg`, `proj-1900.jpg`, `teamhover-crop.jpg`, `stacktitle-*.png`, …): `docs/design-references/norda-framer-website-3f1ea7cb/research-probes/`.
- Systematic reference | local | diff composites: `docs/design-references/norda-framer-website-3f1ea7cb/<page-key>/compare/` (from `tests/qa-visual.mjs`).
