# `/about` — page topology (page key `about-979bddc4`)

Route file `src/app/about/page.tsx`. Dark page (`#111`). Evidence: `raw/about-979bddc4/`, `design-references/<site>/about-979bddc4/`.

| # | Section | Component | Layer / flow | Interaction model |
| --- | --- | --- | --- | --- |
| 1 | Page header ("About", intro with text-indent) | `PageHeader` (`phoneFullWidth`) | flow, half-speed | anchor link |
| 2 | Main `#main-container` (dark) | `InnerMain tone="dark"` | over the header | — |
| 2a | Introduction: lead (founders bold) + "Join Us ↘" → `#job-openings` | `LeadText`, `ArrowLink lg icon=down-right` | flow | in-page anchor |
| 2b | Team image with rotating "NORDÅ ARCHITECTS DREAM TEAM ~" badge | `ParallaxImage` + `RotatingBadge` | flow | time (8s/turn) + parallax |
| 2c | Meet the Team (`#meet-the-team`) | `MeetTheTeam` | desktop: 360vh section, sticky 100vh title, 260vh scatter layer of 9 portraits; tablet 3-col grid; phone 1 col | scroll-linked drift + hover (desktop) |
| 2d | Publications (rows) | `RecordList variant="publications"` | flow | per-row appear (desktop) |
| 2e | Closing lead + body, office image | `LeadText`, `ParallaxImage` | flow | parallax |
| 2f | Job openings (`#job-openings`, 4 jobs) | `JobList tone="light"` | flow | links to `/jobs/<slug>` |
| 3 | Footer | `SiteFooter` | revealed under content | — |
