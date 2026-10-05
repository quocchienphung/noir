# JobDetailTemplate (shared by the four `/jobs/<slug>` entries)

- **Identity:** `src/app/jobs/[slug]/page.tsx` → `shared/templates/JobDetailTemplate.tsx` · `job-detail.module.css` · data `jobs.ts` (+ shared `jobOffer`, `jobHowToApply`) · evidence `raw/jobs--*/`.
- **Structure:** hero (parallax portrait image + info overlay with Location / Type `dl`, `h1` display title via `CharReveal mode="char"`, hero "Apply Now" on desktop only) → text Columns (title lead, "/  Candidates must" list, role lead, "/  We offer" list, "/  How to apply:" with bold email, "Apply Now") → quote band (ticker "Nordå Architects ~", `CharReveal` quote, author, portrait link to the quoted co-founder's team page) → "More Jobs" with the other three jobs.
- **Layout (M):** desktop hero image + info 100vh, quote band 80vh; tablet hero 640, quote 640; phone hero 400. Ticker centred at 33.93% of the quote band. Tablet portrait 699–977 at 1024 (24px inset beyond the column padding). Title→list gap in More Jobs 16 / 24 / 64.
- **External-only:** "Apply Now" links to `mailto:hello@world.com` on the source → inert `span[role=note]` with an explanatory title, styled like the `md` link (28/33.6 · 32/38.4 · 36/43.2).
- **Motion:** title characters rise 30px with 50ms stagger ≈1.4s after mount (desktop + phone); quote lines rise 60px with 100ms stagger 0.2s after entering view (desktop + tablet); ticker ≈101px/s.
- **Acceptance:** `qa-routes` (4 × 3 widths), `qa-behaviors` char-reveal checks on `/jobs/3d-artist`; local title start on client navigation 1.50s vs source 1.50s.
