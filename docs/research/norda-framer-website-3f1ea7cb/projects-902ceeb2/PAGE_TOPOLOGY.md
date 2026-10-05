# `/projects` — page topology (page key `projects-902ceeb2`)

Route file `src/app/projects/page.tsx`. Evidence: `raw/projects-902ceeb2/`, `design-references/<site>/projects-902ceeb2/`.

| # | Section | Component | Layer / flow | Interaction model |
| --- | --- | --- | --- | --- |
| 1 | Page header (100vh image, indented intro, fit-text "Projects", SCROLL) | `PageHeader` | flow, half-speed | static + anchor link to `#main-container` |
| 2 | Main panel `#main-container` (white, padding 96/144/192) | `InnerMain` | scrolls over the header | — |
| 2a | Intro lead + body | `LeadText` | flow | static |
| 2b | Project stack: Verve Tower, Harbor 12, Nordic One, Summit 24, Ström Haus | `ProjectStack` | desktop: 80vh sticky cards at top 160px; tablet/phone: flow (gap 96 / 64) | scroll-linked shrink (desktop), cursor VIEW PROJECT |
| 2c | Archive Projects (8 rows) | `RecordList` inside the stack's containing block | white block that rises over the last card | in-view appear (desktop) |
| 2d | Outro lead + body ("…a meaningful part of it." with NBSPs) | `LeadText` | flow | static |
| 3 | Footer | `SiteFooter` | revealed under content | — |
