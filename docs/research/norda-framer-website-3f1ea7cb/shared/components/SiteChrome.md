# SiteChrome — fixed logo, MENU and drawer

- **Identity:** all routes · `shared/SiteChrome.tsx` · styles `chrome.module.css` · evidence `design-references/<site>/root-8a5edab2/states/`, `tools/` menu probes (`menu-1440.txt`, `menu3-{1440,1024,390}.txt`, 100ms samples), captured 2026-10-04.
- **Structure:** fixed logo link (top-left) and `button[aria-controls=nd-menu]` (top-right) → `#nd-menu` overlay = backdrop + `role=dialog aria-modal` panel → CLOSE button, `nav[aria-label=Primary]` list of 5 links (Home, Projects, About, News, Contact — `menuLinks` in `navigation.ts`), "+" marker.
- **Content:** labels MENU / CLOSE; links from `menuLinks`; all destinations local (`routes.ts`).
- **Assets:** logo mark and plus marker are inline SVG (`icons.tsx`).
- **Layout (M):** logo 70×30 / 84×36 / 100×43 at 24 / 48 / 64px offsets; MENU 18/21.6 Albert 700 uppercase at the same offsets; drawer width 100% / 67% / 33%, black, full height; backdrop `rgb(34,34,34)` opacity 0.66; links 40 / 50 / 64px Albert 500.
- **State machine:** `closed` → (click MENU) → `open` → (Escape | backdrop | CLOSE | link click | route change) → `closed`. Logo hidden until the page's `[data-nd-chrome-reveal]` element (hero/main) scrolls under the top; after that MENU switches to blend mode over light panels.
- **Motion:** MENU rises 30px → 0 over 1s after 1s (3s on `/`); panel `clip-path: inset(0 0 0 100%)` → 0 in 0.5s ease-in-out; backdrop 0 → 0.66 in 0.5s; links 100px → 0 in 0.5s with 0.15s delay (I, from 100ms samples); reverses on close.
- **Input:** pointer, keyboard (Tab trapped inside the dialog, Escape closes), touch.
- **Accessibility:** `aria-expanded`, `aria-controls`, `inert` + `aria-hidden` while closed, focus moves into the panel on open and returns to MENU on close, `aria-current="page"` on the active link, document scroll locked while open.
- **Acceptance:** `tests/qa-behaviors.mjs` "menu: …" (1440 + 390) — opens, traps focus over 12 Tabs, Escape closes, focus returns, link navigates and closes. Visual: `compare/{1440,1024,390}-menu-open.jpg` (mismatch 0.04 / 0.27 / 0.63%).
- **Uncertainty:** drawer easing/durations are fitted from 100ms samples (I). The source's closing animation was not sampled separately; it is assumed to mirror opening (I).
