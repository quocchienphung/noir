# `/` — page topology (page key `root-8a5edab2`)

Route file `src/app/page.tsx`. Evidence: `raw/root-8a5edab2/` (DOM 1440/390, compact styles 1440/1024/390, appear JSON),
`design-references/<site>/root-8a5edab2/{scroll,states,compare}/`. Document height (M, reference): 14807 / 12434 / 12788
at 1440 / 1024 / 390; local deltas are listed in `../QA_REPORT.md`.

| # | Section | Component | Layer / flow | Interaction model |
| --- | --- | --- | --- | --- |
| 0 | Fixed chrome (logo, MENU, drawer) | `shared/SiteChrome` | fixed overlay | click + keyboard; scroll-reveal of logo |
| 1 | Hero slideshow, 100vh | `HomeHero` | flow, z 1, half-speed content | click (arrows desktop / dots touch), touch swipe; no autoplay |
| 2 | Main container `#main-container` (white, z 2, padding 96/144/192, scroll-margin 90) | `src/app/page.tsx` `<main>` | flow over the hero | — |
| 2a | Intro "Nordå — an architecture and design studio…" + body | `AboutSection` + `CharReveal` | flow | in-view character reveal (desktop) |
| 2b | Counters 15 Years · 44 Projects · 8 Awards · 32 Clients | `Counters` | flow | scroll-linked (desktop), static otherwise |
| 2c | Studio image + leadership copy + "About →" | `AboutSection`, `ParallaxImage`, `ArrowLink lg` | flow | scroll parallax |
| 3 | Video statement "Crafting spaces…" + Awards list (8) | `VideoAwards`, `FitText clip`, `RecordList` | desktop: 250vh sticky stage (video frame scales 0.66 → 1, wave mark fades) with the white Awards panel scrolling over; tablet/phone stacked | scroll-linked + in-view appear + cursor previews |
| 4 | Services title, image, 5-step process accordion | `ServicesSection`, `ServicesAccordion` | flow | click/keyboard toggles, independent items |
| 5 | Partners (two rows × 4 logo tiles) + outro | `PartnersSection` | flow | static |
| 6 | Featured article card | `FeaturedArticle` → `ArticleCard` | flow | cursor READ ARTICLE, parallax |
| 7 | Testimonials (ticker band + 4-slide slideshow) | `Testimonials`, `Ticker`, `CharReveal` (slide 1) | flow, 100vh / 80vh / 720px | time (ticker) + click/dots/swipe |
| 8 | Footer | `shared/SiteFooter` | revealed under the content layer | scroll-linked (desktop), form |

Dependencies: SiteChrome reads `[data-nd-chrome-reveal]` on `<main>`; MENU rise delay 3s on this page (`data-nd-menu-delay="3"`).
Cursor previews for the eight awards are rendered once by `InteractionLayer`.
