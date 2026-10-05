# NOIR route and content map

All copy comes from `src/data/noir/site.ts`, `src/data/noir/intro.ts` and `src/data/noir/privacy.ts`.
The UI is in English. There are no clients, awards, counters, testimonials, case studies or
certifications. Add real ones to the data files when they exist.

| Route | Title | Content | Source components |
| --- | --- | --- | --- |
| `/` | NOIR — Digital experiences. Built with depth. | Intro dive (headline, lead, "Start a project" → `/contact`, "Explore work" → `/projects`, gauge, statement) → Capabilities (six pillars, no counters) → Cinematic black-hole frame ("Complexity / pulled into / a single orbit.") → Services (5, native disclosure accordion) → Process (Discover → Architect → Build → Launch → Evolve) → Principles (3) | `NoirIntro`, `NoirCapabilities`, `NoirCinematic`, `NoirServices`, `NoirProcess`, `NoirPrinciples` |
| `/projects` | Work — NOIR | Honest note (no public case studies yet). "Selected experiments": this site's event-horizon renderer and this website itself, plus what we can build and an offer of private walkthroughs | `app/projects/page.tsx` |
| `/about` | About — NOIR | Studio description, mark panel, CTAs, process, typical stack (editable), principles | `app/about/page.tsx` |
| `/contact` | Contact — NOIR | Form (name, email, project type, description, optional budget) that validates and then says plainly "not sent" with a copy-to-clipboard option; "What happens next" aside | `ContactForm` |
| `/privacy-policy` | Privacy policy — NOIR | Describes reality: no cookies, analytics or trackers; the form sends nothing; self-hosted assets; hosting logs | `data/noir/privacy.ts` |
| `/404` and unknown paths | Page not found — NOIR | Mark, "Lost past the horizon.", back home | `app/not-found.tsx` |

## Retired routes (307 redirects in `next.config.ts`)

| From | To | Reason |
| --- | --- | --- |
| `/projects/:slug` | `/projects` | the old architecture case studies are gone |
| `/team/:slug*` | `/about` | no team profiles are published |
| `/jobs/:slug*` | `/contact` | no vacancies |
| `/news`, `/news/:slug*` | `/` | no articles |

## Global chrome

- **Header**: wordmark (mark + live text "NOIR", always links to `/`); on ≥ 810 px, inline nav (Home,
  Work, About, Contact) plus "Start a project"; on phones, a "Menu" drawer with the same links. The
  drawer traps focus, closes on Escape or navigation, and returns focus to its trigger.
- **Footer**: closing call to action, nav (Home, Work, About, Contact, Privacy), large NOIR lockup,
  "© 2026 NOIR. Digital experiences. Built with depth.", "Back to top". There is no newsletter and no
  social links, since none exist.
- **Metadata**: the title template `%s — NOIR`, description, favicon/apple/manifest icons and the OG
  image all come from `src/app/layout.tsx`.

## Needs input from the owner

- A real contact destination (`contactDestination` in `site.ts`). Until it is set, the form stays in its
  honest "not sent" mode.
- Real projects, clients or testimonials, if and when they can be published.
- The production domain (`NEXT_PUBLIC_SITE_URL`) for absolute OG URLs.
