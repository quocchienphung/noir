# Output plan — Nordå reconstruction

| Item | Value |
| --- | --- |
| Source origin | `https://norda.framer.website` (Framer site, captured 2026-10-04) |
| App root | `.` (single Next.js 16.3 app; the scaffold's `src/app/page.tsx` was replaced — untouched template) |
| Site key | `norda-framer-website-3f1ea7cb` = slug + sha256("https://norda.framer.website")[:8] |
| Page key rule | segment-preserving slug (`/` → `--`, diacritics folded) + sha256(pathname)[:8]; `/` → `root-8a5edab2` |
| Route graph | 31 routes (30 sitemap URLs + linked `/404`), closed — see `ROUTE_MANIFEST.json`, `raw/crawl.json` |

## Route destinations

| Source path | Local route file | Page key | Template / owner |
| --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | `root-8a5edab2` | home sections in `components/sites/<site>/root-8a5edab2/` |
| `/projects` | `src/app/projects/page.tsx` | `projects-902ceeb2` | `PageHeader` + `ProjectStack` + `RecordList` |
| `/projects/{verve-tower, harbor-12, nordic-one, summit-24, ström-haus}` | `src/app/projects/[slug]/page.tsx` | `projects--<slug>-<hash>` | `templates/ProjectDetailTemplate` |
| `/about` | `src/app/about/page.tsx` | `about-979bddc4` | `PageHeader`, `MeetTheTeam`, `RotatingBadge`, `RecordList`, `JobList` |
| `/team/<9 slugs>` (Unicode slugs kept) | `src/app/team/[slug]/page.tsx` | `team--<slug>-<hash>` | `templates/TeamMemberTemplate` |
| `/jobs/<4 slugs>` | `src/app/jobs/[slug]/page.tsx` | `jobs--<slug>-<hash>` | `templates/JobDetailTemplate` |
| `/news` | `src/app/news/page.tsx` | `news-f46b16ed` | `PageHeader` + `ArticleCard` list |
| `/news/<6 slugs>` | `src/app/news/[slug]/page.tsx` | `news--<slug>-<hash>` | `templates/ArticleTemplate` |
| `/contact` | `src/app/contact/page.tsx` | `contact-4eb95063` | `PageHeader`, `ContactForm`, `FitText` |
| `/privacy-policy` | `src/app/privacy-policy/page.tsx` | `privacy-policy-81e51d8c` | inline layout + `RichText` |
| `/404` + unknown paths/slugs | `src/app/404/page.tsx` (`notFound()`), `src/app/not-found.tsx` | `404-316556f0` | `NotFoundView` |

Dynamic segments use `generateStaticParams` + `dynamicParams = false`, so unknown slugs return the 404 view with HTTP 404.

## Artifact roots

| Kind | Location |
| --- | --- |
| Research per page | `docs/research/<site>/<page-key>/` (`PAGE_TOPOLOGY.md`, `BEHAVIORS.md`, `components/`) |
| Shared specs | `docs/research/<site>/shared/components/` |
| Raw evidence | `docs/research/<site>/raw/<page-key>/` (rendered DOM 1440/390, compact style dumps 1440/1024/390, appear JSON, head) |
| Screenshots | `docs/design-references/<site>/<page-key>/` (`scroll/`, `states/`, `compare/`) — never imported or served |
| Components | `src/components/sites/<site>/<page-key>/` and `…/shared/` (+ `shared/templates/`) |
| Data / types | `src/data/sites/<site>/*.ts`, `src/types/sites/<site>.ts` |
| Pure helpers / hooks | `src/lib/sites/<site>/`, `src/hooks/sites/<site>/` |
| Styles | `src/styles/sites/<site>/` (CSS Modules; tokens in `site.module.css`) |
| Assets | `public/sites/<site>/<page-key>/` for single-route media, `public/sites/<site>/shared/` for reused media, fonts and SEO files |
| Scripts | `scripts/download-assets-<site>.mjs`, `scripts/generate-asset-map-<site>.mjs` |
| Tests | `tests/qa-routes.mjs`, `tests/qa-behaviors.mjs`, `tests/qa-independence.mjs`, `tests/qa-visual.mjs` |

## Shared foundation (single owner, sequential)

- `src/app/layout.tsx` — local fonts via `next/font/local` (Albert Sans variable + static faces, Inter 700), metadata, `SiteShell`.
- `src/app/globals.css` — scaffold imports kept; body font/background tokens only.
- `next.config.ts` — `output: "standalone"`, `images.localPatterns` limited to `/sites/**` (no remote patterns).
- `package.json` — devDependency `playwright` (test runner driving system Chrome) and `qa:*` scripts; lockfile updated with it.
- Shared contracts: `routes.ts` (only mapping from source paths to local hrefs), `assets.ts` (generated typed asset map), `navigation.ts`.

## Execution notes

- No browser MCP was available; Playwright (system Chrome) was used for all inspection and QA.
- Subagents/worktrees were not used; all components were built sequentially by the integration owner.
- Out of scope by instruction: Framer "Get this template" promo overlay and badge, remote analytics, real form delivery, external links (rendered inert with an explanation).
