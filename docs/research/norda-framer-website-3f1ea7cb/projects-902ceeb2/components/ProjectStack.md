# ProjectStack

- **Identity:** `/projects` · `projects-902ceeb2/ProjectStack.tsx` · `projects-902ceeb2/stack.module.css` · evidence `tools/`: `frames.mjs`, `stackmeas.mjs`, `stacktop.mjs`, `stackh.mjs`, `proj-1900.jpg`; `compare/1440-y1800.jpg` etc.
- **Structure:** `div.stack` → 5 `article` cards → full-card `Link` → frame (cursor VIEW PROJECT on desktop only; image, 4 "+" markers, content: name + aria-hidden "View Project →") → followed by `children` (Archive section) inside the same containing block.
- **Content:** names and slugs from `projectCards` in `projects.ts`; each links to `/projects/<slug>` (Ström Haus encoded as `str%C3%B6m-haus`).
- **Layout (M):** card height 80vh at all breakpoints; padding 0 gutter; names 184/147.2 ls −12.88 (desktop) · 152/121.6 ls −9.12 (tablet) · 80/64 ls −4 (phone), Albert 500 centred; markers 64 / 48 / 24 from the corners; flow gap 96 (tablet) / 64 (phone) / 0 (desktop, sticky).
- **State:** `--nd-shrink` ∈ [0,1] per card = overlap of the following element over the card ÷ card height.
- **Motion:** frame `inset: shrink × 20%`; content offset by −20cqw/−20cqh × shrink so it stays fixed (container query units). Desktop only; reduced motion → 0.
- **Accessibility:** one link per card with the project name as text; decorative markers hidden.
- **Acceptance:** desktop frame geometry within ≤ 16px of the reference at the sampled scroll positions; card tops 160px; Ström Haus shrinks under the archive (fixed 2026-10-05).
- **Uncertainty:** source smoothing constant unknown (U); not reproduced.
