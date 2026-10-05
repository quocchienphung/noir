# ServicesSection + ServicesAccordion, PartnersSection, FeaturedArticle

## Services
- **Identity:** `/` · `ServicesSection.tsx`, `ServicesAccordion.tsx` · `services.module.css` · evidence `tools/`: `acc.mjs`, `acc.jpg`, compact dumps.
- **Structure:** display title "Services" + intro, parallax image, `ul` of 5 steps; each `li` (cursor dot) = number label "/  01", `h3 > button[aria-expanded][aria-controls]` with title and +/− icon, `role=region` panel (inert while closed) with `RichText` (paragraphs + dash bullets).
- **Content:** 01 Discovery & Visioning · 02 Design Development · 03 Planning & Coordination · 04 Build & Execute · 05 Final Touches & Handover (copy in `home.ts`).
- **Interaction model (M):** click-driven, not scroll-driven; items open independently; all closed initially.
- **Motion:** grid-template-rows 0fr → 1fr and the vertical bar rotate 90° → 0 over 0.48s `cubic-bezier(0.22,1,0.36,1)` (I curve).
- **Acceptance:** `qa-behaviors` "services accordion: toggle items independently" and "…keyboard Enter / Space".

## Partners
- **Identity:** `PartnersSection.tsx` · `partners.module.css` · evidence `tools/`: `logos.mjs`.
- **Layout (M):** tiles 280×147 at 1440 (flex 1, gap 64 / 48 / 24), 240×160 logo centred, 16px corner brackets at 5% black; phone shows the two rows as two columns. Title "Our Partners", outro paragraph (NBSP "a reputation", "a trusted" — M).
- **Assets:** 8 logo images (two rows of four in `home.ts` `partners.rows`).

## FeaturedArticle
- `FeaturedArticle.tsx` → `ArticleCard` with the first article (cover, title, excerpt, "Read Article" → `/news/how-architecture-shapes-productivity`); bottom padding per breakpoint (M).
- Link sizes `md`: 28/33.6 (phone) · 32/38.4 (tablet, variable 500) · 36/43.2 (desktop) (M, `linkin.mjs`).
