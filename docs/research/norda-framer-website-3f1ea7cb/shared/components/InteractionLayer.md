# InteractionLayer — cursor follower and roll-text trigger

- **Identity:** all routes · `shared/InteractionLayer.tsx`, `shared/RollText.tsx` · `cursor.module.css`, `roll.module.css` · evidence: `tools/` `cursors.mjs`, `roll.mjs`, `hover.jpg`, the reference's injected component CSS.
- **Structure:** one fixed, `aria-hidden`, `pointer-events: none` layer containing: 20px black dot, "VIEW PROJECT" and "READ ARTICLE" labels with 8px corner brackets, eight award preview images (33vh tall, aspect 0.754).
- **Variant selection (M — Framer `data-framer-cursor` map read from the page modules, `tools/cursormap.mjs`, `cursortree.mjs`):** the nearest `[data-cursor]` ancestor wins. Zones:

| Variant | Where |
| --- | --- |
| `dot` (20px black) | page default on light pages (`SiteShell`), services rows, testimonial slides (desktop), project-card margins |
| `dot-white` (20px white) | dark pages (`/about`, `/contact`, `/team/*` — header and main), footer, video + awards section, open menu overlay |
| `none` | every arrow/roll link (`ArrowLink` default), logo (fixed + hero), MENU / CLOSE, menu links, hero chrome and arrows, testimonial chrome and arrows, SCROLL links, team cards, job rows, archive rows, contact fields, Send and "Google Maps", "Apply Now", quote author and portrait, newsletter form + disclaimer, sitemap links, social icons, BACK TO TOP, attribution |
| `view-project` | hero slides, project-stack frames (desktop only; the shrinking frame only), "Next Project" banner |
| `read-article` | article-card image frames (not the gutters of the link) |
| `award-1…8` | award rows, desktop only (33vh preview image) |

Desktop-only zones carry `data-cursor-min="1200"`; below that width the resolver skips them and uses the parent zone
(MEASURED at 1024: award rows → white dot, project cards → dot, testimonial slides → none).

Verification: `tools/zonegrid.mjs` samples a 9×7 grid of viewport points every 700px of scroll and resolves the zone
on both sites (reference: nearest `data-framer-cursor` id → variant; local: same resolver as `InteractionLayer`):
**17 / 17,199 points disagree at 1440 over all 31 routes (0.10%)** and **6 / 4,494 at 1024 over 11 templates (0.13%)**,
all at element edges during scroll-linked motion or in the tablet footer form (inconsistent on the reference itself).
The last project's wrap-around "Next Project" banner keeps the dot, as on the source.

Before 2026-10-05 the follower only appeared over links/buttons; the reference shows the dot almost everywhere (verified by screenshots: black over light content, white over the video and footer).
- **Motion:** follower position eased toward the latest pointer position each animation frame (per-frame smoothing fitted to the measured follow lag — I; no React state per frame); variant fade 0.2s. Roll text: each glyph rolls up (duplicate rises from below) 300ms with 35ms stagger, ease-in-out, on pointer enter only — no reverse on leave (M).
- **Input:** fine pointer only (`(hover: hover) and (pointer: fine)`); touch and keyboard users see normal focus styles and no follower.
- **Accessibility:** decorative layer hidden from assistive technology; RollText exposes one readable label and hides the glyph duplicates.
- **Acceptance:** `qa-behaviors` "cursor follower zones" (project card → `view-project`, MENU → `none`, body text → `dot`, footer title → `dot-white`, sitemap link → `none`); `tools/ourcursor.mjs` checks 27 hover targets against the map (all pass).
- **Uncertainty:** the smoothing factor is a fit to sampled lag, not a value read from the source (I).
