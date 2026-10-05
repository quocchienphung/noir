# QA report — Nordå reconstruction

Reference: `https://norda.framer.website` (captured 2026-10-04/05). Local: standalone production build
(`node .next/standalone/server.js`, `http://127.0.0.1:3200`) unless stated. Browser: system Chrome via Playwright 1.58,
DPR 1, viewports 1440×900, 1024×900, 390×844 (plus 1440×700, 1024×700, 390×700, 1440×1100 for viewport-height checks).

## 1. Build gates

| Command | Result |
| --- | --- |
| `npm run lint` | pass (0 problems) |
| `npm run typecheck` | pass |
| `npm run build` | pass — 33 static pages (31 routes + `_not-found` + Unicode slugs prerendered) |

## 2. Route coverage — `tests/qa-routes.mjs` → `qa/route-report.json`

33 paths (31 discovered routes + `/this-route-does-not-exist` + `/projects/unknown-slug`) × 3 widths = **99 checks, 0 with issues**.
Each check: HTTP status (200, or 404 for `/404` and unknown paths), console/page errors (0), failed same-origin requests (0),
broken images/video (0), horizontal overflow (0 px everywhere), external requests aborted and recorded (**0 attempted**).

Document height vs reference crawl (1440 / 390): every route within **±3px**. Tablet (1024, compared live with
`tools/heights.mjs`): every route within **1–2px**. Viewport-height variance (`tools/frameh.mjs`,
reference vs local at 1440×700, 1024×700, 390×700, 1440×1100 on 11 representative routes): all within **±5px** after the
viewport-relative height fixes (before: up to ±520px on `/about`, ±200px on `/team/*`, ±160–360px on image-heavy pages).

## 3. Behavior — `tests/qa-behaviors.mjs` → `qa/behavior-report.json`

**29 / 29 passed**, 0 external requests, 0 POST requests.

| Area | Checks |
| --- | --- |
| Menu (1440, 390) | opens, `aria-expanded`, scroll lock, focus trapped over 12 Tabs, Escape closes, focus returns to MENU; menu link navigates and closes |
| Home hero | next / previous / wrap-around (1440); dots + touch swipe (390) |
| Services | items toggle independently; keyboard Enter / Space |
| Testimonials | next / previous with live status |
| Forms | newsletter empty / invalid / valid → "Demo only" notice; contact required fields (4 invalid, focus on first) → demo notice |
| Navigation | internal links, history back / forward, back-to-top, project "Next Project" link |
| Deep links | `/about#job-openings`, `/about#meet-the-team`, `/news#main-container`, `/team/erik-lindholm#main-container` land at top 0 |
| 404 | `/404`, `/not-a-page`, unknown project / team / job / news slugs → HTTP 404 + 404 view |
| Pointer | cursor zones: VIEW PROJECT over a project frame, none over MENU, black dot over body text, white dot over the footer, none over sitemap links |
| Character reveals | job title hidden → visible after load (desktop), static on tablet, home intro hidden until scrolled into view |
| Reduced motion | counters at final state, reveals static |
| Keyboard pass (`tools/tabpass.mjs`) | 58–59 Tab stops on `/`, `/about`, `/contact`; every stop has an outline except form fields, whose focus indicator is the underline turning white (as on the source) |

Additional measured motion checks (research probes in `tools/`): character reveal start/half times per line within
10–25ms of the reference (`charstarts.mjs`); job title start after client navigation 1.50s vs 1.50s (`spanav.mjs`);
project-stack frame geometry within ≤16px mid-transition (`stackmeas.mjs`); parallax offsets identical at sampled
scroll positions (`plx.mjs`); ticker band positions identical at 700/900/1100 (`tickpos*.mjs`).

### Cursor zones and hover states

- The reference's cursor map was read from its page modules (`data-framer-cursor` id → Black / White / None / View
  Project / Read Article / Award n). `tools/zonegrid.mjs` resolves the zone at a 9×7 grid of viewport points every
  700px of scroll on both sites: **17 / 17,199 points disagree at 1440 across all 31 routes (0.10%)** and
  **6 / 4,494 at 1024 on 11 templates (0.13%)**; the residue sits on element edges during scroll-linked motion
  (awards list mid-appear, footer parallax, team drift) and in the tablet footer form, where the reference is itself
  inconsistent between pages. Desktop-only zones (award previews, project labels, testimonial dot) use
  `data-cursor-min="1200"`.
- Hover crops (`tools/hovercmp.mjs`, `jobhover*.mjs`, `teamrest.mjs`): job rows (arrow 8 → 32px, hairline 10% → 100%,
  local 141ms → 0.668 vs reference 147ms → 0.661), team cards (name top 202 of 262 on both), newsletter submit, hero and
  testimonial arrows, footer links match. Fixed on 2026-10-05: follower previously shown only over links/buttons;
  job-row arrow slide and hairline; team-card name 14px low; testimonial arrows covered by the dot.

### Firefox smoke test (`tools/firefox.mjs`, Playwright Firefox 146)

All 31 routes at 1440 and 390 against the production build: 0 console errors, 0 external requests, 0 horizontal
overflow, 0 broken or upscaled images, `linear()` easing applied to reveals. Document heights within 0–5px of the
Chrome run except `/privacy-policy` at 390 (−33px, engine text wrapping); the reference shows the same shift in
Firefox — local vs reference in Firefox (`tools/ffref.mjs`): `/privacy-policy` 390 Δ3, `/jobs/3d-artist` 1440 Δ6 /
390 Δ4, `/team/erik-lindholm` 1440 Δ1.

## 4. Visual comparison — `tests/qa-visual.mjs` → `qa/visual-report.json`

502 scroll frames (31 routes × 1440 / 1024 / 390, up to six viewport frames each) plus 8 interaction states, reference
and local captured at the same viewport, DPR 1 and scroll position after a full pre-scroll (in-view effects played)
and a 3.2s settle. Only the reference's floating template promo and Framer badge are hidden. Metric: a pixel differs
when max(|ΔR|,|ΔG|,|ΔB|) > 48 (8-bit sRGB); ratio = differing pixels / all pixels. Composites (reference | local |
diff) are in `docs/design-references/<site>/<page-key>/compare/<width>-<state>.jpg`.

| Width | Frames | Median | 90th pct | ≤ 1% | ≤ 3% | > 5% |
| --- | --- | --- | --- | --- | --- | --- |
| 1440 | 172 | 0.14% | 1.06% | 153 | 165 | 2 |
| 1024 | 161 | 0.30% | 1.45% | 110 | 154 | 1 |
| 390 | 177 | 0.61% | 3.49% | 101 | 152 | 2 |
| all | 510 | 0.29% | — | 364 | 471 | 5 |

Interaction states: menu open 0.04% / 0.27% / 0.62% (1440 / 1024 / 390); hero slide 2 0.07%; testimonial 2 3.37%
(ticker phase only); first service step expanded 1.15% / 1.70% / 4.20% (1px text offsets).

The five frames above 5% are the home video section (`/ 1440 y4500` 28.7%, `/ 390 y3376` 19.8%, `/ 1024 y3600` 13.2%,
`/ 1440 y3600` 7.4%) and `/contact 390 y2532` (5.7%, 1px vertical offset of long text). The video frames differ because
the looping video and the ticker cannot be time-aligned; the statement text, frame scale and layout in those frames were
verified separately (`tools/crafting2.mjs`: identical line boxes at 1440 and 1024). Remaining non-zero ratios are
dominated by antialiasing and 1–2px vertical offsets of text.

This run used the build before three cursor-only changes (desktop-only zones, newsletter zone, last-project banner);
they do not affect captures because the pointer rests at (1, 1), which is the same zone in every build.

## 5. Independence

Runtime (`qa-routes`, `qa-behaviors`): every request leaving `127.0.0.1:3200` is aborted and recorded in a fresh
context with service workers blocked — **0 attempted** across 99 route loads and 29 behavior scenarios; all images,
fonts and the video load from the local origin.

Static (`tests/qa-independence.mjs` → `qa/independence-report.json`), after `npm run build`:

| Check | Result |
| --- | --- |
| Upstream hosts (framerusercontent, framer.website/.com/.app, framerstatic, events.framer, Google Fonts, analytics) in `src/`, `public/`, `.next/server`, `.next/static` (591 text files) | **0** |
| Prerendered HTML: canonical / og:url / meta refresh / form `action` / off-site `href` | **0** |
| Reference screenshots (`docs/design-references`) served from `public/` or referenced from `src/` | **0** (1400+ captures checked by sha256) |
| `public/sites/<site>/` files ⇔ `ASSET_MANIFEST.json` (path + sha256) | 84 / 84 match; 0 unlisted, 0 missing |

Server side: fonts via `next/font/local`; `next/image` restricted to `images.localPatterns: /sites/**` with no
`remotePatterns`, so the optimizer cannot fetch remote images; no `fetch`, `XMLHttpRequest`, `sendBeacon`, iframes or
`dangerouslySetInnerHTML` in `src/`. Provenance URLs live only in `docs/` and `scripts/`.

## 6. External-only links on the source and local treatment

| Source target | Where | Local |
| --- | --- | --- |
| `facebook.com`, `x.com`, `instagram.com` | footer socials | inert icons in a list labelled as not included |
| `maps.google.com` | contact "Google Maps →" | inert `role="note"` with explanatory title |
| `mailto:hello@world.com` | "Apply Now" and the bold "How to apply" email (jobs), contact email | inert note / bold text / text with explanatory title |
| `tel:000000` | contact phone | text with explanatory title |
| `www.framer.com/?via=drukarov` | Awards rows (home), Archive rows (/projects) | plain rows (awards keep the cursor preview) |
| `framer.link/drukarov`, `templatoria.com` | footer "Framer template handcrafted by Anton Drukarov" | plain text |
| `quadro-template.framer.website`, `www.framer.com` badge, "Get this template" overlay | promo | omitted (out of scope) |

Forms never post: newsletter and contact use local validation and an explicit "Demo only — … not sent" notice. The
source's real success states were not exercised (production forms not submitted, per instructions) — unverified.

## 7. Remaining differences (ranked by impact)

1. **Time-based media cannot be frame-aligned** — the video statement and tickers differ in visual diffs by phase only; geometry was verified separately.
2. **Fitted motion curves (inferred)** — slideshows (1.2s cubic-bezier fit of a Framer spring), menu drawer (0.5s), accordion (0.48s), character-reveal springs (`linear()` fit). Timings match samples; exact spring parameters are unknown.
3. **Scroll smoothing** — the source lags some scroll-linked values slightly (spring-smoothed); the project-stack shrink here tracks scroll directly (≤16px frame difference mid-transition, identical at rest).
4. **Hard-load reveal timing** — the job title reveal starts ≈0.2s earlier than the source on a cold load (faster hydration); identical on client navigation.
5. **Text-node segmentation** — e.g. "/  01" labels use NBSP + space where the source uses two spaces with `pre-wrap`; the bold email in the policy includes its period. Rendering is identical.
6. **Browser coverage** — full suites in Chrome; smoke-tested in Firefox (above). Safari was not tested (CSS `linear()` easing, `max()` in `sizes` and container query units are used; all are supported by current Safari).
7. **Environment** — Node 22.14 was used although the template declares Node ≥ 24 (engines warning; build and runtime unaffected).

No screenshot-based UI, iframes, copied Framer runtime, upstream redirects or hotlinked media are used.
