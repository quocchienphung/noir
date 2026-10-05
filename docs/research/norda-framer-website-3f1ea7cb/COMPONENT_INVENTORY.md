# Component inventory — Nordå

Root: `src/components/sites/norda-framer-website-3f1ea7cb/`. "client" = `"use client"` boundary; everything else is a
Server Component. Styles live in `src/styles/sites/<site>/` under the same names. Specs: `shared/components/*.md`
and `<page-key>/components/*.md` next to this file.

## App shell (shared/)

| Component | Kind | Responsibility | Used by |
| --- | --- | --- | --- |
| `SiteShell` | server | fixed chrome → black content layer (z 3) → footer underneath → cursor layer; `<noscript>` fallback for reveals | `app/layout.tsx` |
| `SiteChrome` | client | logo + MENU (rise on load, reveal after the hero), drawer menu with focus trap, Escape, scroll lock, focus return, close on navigation | every route |
| `SiteFooter` | client | newsletter, sitemap, inert socials, back-to-top, legal; desktop reveal parallax + sticky wordmark | every route |
| `NewsletterForm` | client | local validation + explicit "Demo only" notice; never posts | footer |
| `InteractionLayer` | client | single delegated cursor follower (dot / VIEW PROJECT / READ ARTICLE / award previews) and roll-text trigger | every route |

## Motion / layout primitives (shared/)

| Component | Kind | Responsibility |
| --- | --- | --- |
| `Columns` | server | measured 1 : 2 : 1 column rule with optional "+" marker |
| `RollText` | server | accessible label + aria-hidden per-glyph duplicate for the hover roll |
| `CharReveal` | client | per-character reveal (line mode on view / char mode after mount), breakpoint-gated, one accessible copy |
| `InView` | client | toggles `data-inview` (replaying or once) for CSS appear effects |
| `ParallaxImage` | client | framed image with −300px → 0 scroll parallax, corner markers, overlay slot |
| `HalfSpeed` | client | moves its content at half scroll speed (page headers, hero) |
| `FitText` | server | Framer fit-text as SVG `foreignObject`; optional `clip` (box-clipped) and `align` |
| `Ticker` | server | CSS marquee (~101px/s) |
| `ArrowLink` | server | underlined link + arrow, sizes `lg` / `md`, tones, `mdPhoneLarge` variant |
| `RecordList` | server | hairline list (Awards / Archive / Publications) with appear variants |
| `RichText` | server | paragraphs, `{bold}` runs, `\n` breaks, dash/disc bullets |
| `ArticleCard` | server | parallax cover + date, title, excerpt, "Read Article" (home feature + /news) |
| `JobList` | server | job rows linking to `/jobs/<slug>` |
| `icons.tsx` | server | logo mark, wave mark, plus marker, Phosphor arrows, minus, close, social glyphs |

## CMS templates (shared/templates/)

| Template | Routes | Data |
| --- | --- | --- |
| `PageHeader` | /projects, /news, /about, /contact | `PageTitleSpec` per page (3 viewBoxes, offset, box ratio) |
| `InnerMain` | listing/about/contact main panel (`#main-container`) | — |
| `ProjectDetailTemplate` | /projects/<5 slugs> | `projects.ts` `projectDetails` |
| `TeamMemberTemplate` | /team/<9 slugs> | `team.ts` |
| `JobDetailTemplate` | /jobs/<4 slugs> | `jobs.ts` (+ `jobOffer`, `jobHowToApply`) |
| `ArticleTemplate` | /news/<6 slugs> | `news.ts` |

## Page sections

| Page key | Components |
| --- | --- |
| `root-8a5edab2` | `HomeHero` (client), `AboutSection` + `Counters` (client), `VideoAwards` (client), `ServicesSection` + `ServicesAccordion` (client), `PartnersSection`, `FeaturedArticle`, `Testimonials` (client) |
| `projects-902ceeb2` | `ProjectStack` (client) |
| `about-979bddc4` | `MeetTheTeam` (client), `RotatingBadge` |
| `contact-4eb95063` | `ContactForm` (client) |
| `404-316556f0` | `NotFoundView` (client) |

## Data, types, helpers

- `src/data/sites/<site>/`: `assets.ts` (generated, 84 entries), `navigation.ts`, `home.ts`, `projects.ts`, `team.ts`, `jobs.ts`, `news.ts`, `about.ts`, `contact.ts`, `privacy.ts`.
- `src/types/sites/norda-framer-website-3f1ea7cb.ts`: content and asset contracts.
- `src/lib/sites/<site>/`: `routes.ts` (only source → local href mapping, NFC slug decoding), `scroll.ts` (shared rAF scheduler, `clamp01`, `prefersReducedMotion`), `media.ts` (`imageAsset`), `chrome.ts` (reveal attribute).
- `src/hooks/sites/<site>/`: `useScrollFrame` (subscribe to the scheduler), `useLoopSlider` (cloned loop track, touch/pen swipe).

Original Framer class names and wrappers are not used anywhere in the component model.
