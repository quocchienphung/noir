# NOIR — Cards Almanac replacement master

## Task and authority

Implement the Cards Almanac section from https://www.getlayers.ai/sections?layer=cards-almanac in this existing NOIR project. The user explicitly chose it to **replace the wormhole AND tesseract**, not to add a second gallery below them. This is the current task; older spacetime/tesseract prompts do not govern this replacement.

The replacement begins AFTER the existing black-hole intro finishes and ends BEFORE the existing `NoirCinematic` / Complexity section. Keep the approved hero black hole, environment lensing, intro dive, 360° orbit interaction and cinematic black-hole section intact. Preserve services, process, principles, shell, navigation and routes. Do not rebuild any black-hole shader, change its exposure, or change the intro scroll timing to accommodate cards.

Do the implementation and verification, not just describe a plan. Do not reset this dirty workspace. Inspect the actual files first; documentation is a dated snapshot, not permission to overwrite unrelated changes.

## Required reading, in order

1. Root `AGENTS.md` and applicable nested rules; the relevant installed Next.js guides before writing application code.
2. `docs/research/cards-almanac/INSPECTION.md` — observed reference and repository integration map.
3. `prompt/references/cards-almanac/REFERENCE_INDEX.md` and `manifest.json`.
4. Open `contact-sheet.jpg`, `public-poster.webp`, and the full-size frames at 0.00, 0.60, 1.40, 2.00 and 2.80 seconds. Watch `public-preview.mp4` if tools permit.
5. `prompt/cards-almanac/01_LAYOUT_AND_MOTION.md`.
6. `prompt/cards-almanac/02_CONTENT_AND_INTEGRATION.md`.
7. `prompt/cards-almanac/03_QA.md`.
8. Compare current protected files against `prompt/references/cards-almanac/protected-code-baseline.json`. Record pre-existing differences; do not revert them.

If images cannot be inspected, explicitly report the limitation. Do not pretend to have viewed the clip. Use the local reference if the public page becomes unavailable. The reference media is for inspection only, never a runtime background or substitute for coded cards.

## What must be recognizable

A warm ivory section; centered small editorial eyebrow, prominent black heading and restrained gray description; generous whitespace; large white rounded cards with a nearly square cover on the left and editorial text on the right. The right column has metadata and description at the top, intentional empty space, a small category pill near its lower left and a black circular plus button at its lower right.

Native page scrolling makes the next card rise from below, cover the previous card and join a compact stack. Older cards retreat slightly in scale and leave narrow, staggered top edges visible. New covers gently zoom inside their clipped image frames. A subtle 3D lean accompanies the overlap. This is the visual identity of the reference; a static grid, horizontal carousel, tunnel, generic accordion or stack of thin transparent outlines does not satisfy it.

Match the reference geometry and motion before polishing. Use real NOIR project information rather than copying the reference's art-dispatch prose. Artwork and content will differ; do not claim literal pixel identity when assets differ. Desktop appearance has evidence; mobile, click behavior and final release are explicitly proposed adaptations in the supporting specs.

## Scope checklist

- Replace `<NoirTesseract />` in `src/app/page.tsx` with one new `<NoirCardsAlmanac />` at the same position.
- Retire the wormhole/tesseract runtime, canvas, camera navigation, room controls and archive-specific query/debug plumbing from this page.
- Preserve meaningful capabilities copy, project metadata and empty demo slots. A visual replacement must not erase the content previously carried by the archive.
- Build semantic HTML cards and CSS transforms; the section does not need another WebGL renderer or a motion dependency.
- Keep project previews and future live URLs configurable in one typed data file. Do not invent client projects, dates, screenshots or working demo links.
- Make the plus control useful, accessible and honest about empty slots. Its proposed behavior is detailed in the integration spec.
- Respect reduced motion and the existing pause preference. Make all content available without scroll animation.
- Verify the transition intro → cards → Complexity, reverse scrolling, keyboard use, mobile and protected black-hole behavior.

## Execution sequence

1. Inventory current source, imports, existing scroll behavior, data, tests and protected file hashes. Save an implementation baseline without changing protected rendering code.
2. Write a short implementation checklist mapping each requirement to a file and a QA check. Mark every reference estimate as an estimate.
3. Establish the complete semantic layout and data migration first. Keep the source light palette scoped to this section; preserve the rest of NOIR's theme.
4. Add the reversible sticky stack motion and cover zoom. Tune against reference frames, not against an imagined animation.
5. Add project details/live-demo authoring hooks, pause/reduced-motion handling and responsive fallback.
6. Remove the retired runtime path safely after checking usages. Update tests that specifically assert the retired wormhole/tesseract behavior; retain black-hole regression checks.
7. Run the checks in `03_QA.md`, compare browser captures at defined states, correct material mismatches and report measured results.

Do not stop after compilation. If the cards do not visibly stack like the preview, or if old canvas rendering continues behind them, the task is unfinished. Do not hide failing checks by deleting unrelated tests or loosening assertions.

## Deliverables

- Working replacement in the home-page sequence, with source-derived content and configurable demo slots.
- Small, maintainable components, scoped styles and typed data; no copied library modal or Premium source assumption.
- Before/after captures and concise QA evidence under `docs/research/cards-almanac/implementation/`.
- A short demo-authoring guide explaining where to set a cover, project sections and a real live URL.
- Final report: files changed, observed fidelity, adaptations, test results and any unverified limitations. Do not report guaranteed 100% fidelity or 60 fps without evidence.
