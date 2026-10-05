# `/contact` — page topology (page key `contact-4eb95063`)

Route file `src/app/contact/page.tsx`. Dark page. Evidence: `raw/contact-4eb95063/`, `design-references/<site>/contact-4eb95063/`.

| # | Section | Component | Layer / flow | Interaction model |
| --- | --- | --- | --- | --- |
| 1 | Page header ("Contact", intro with text-indent) | `PageHeader` | flow, half-speed | anchor link |
| 2 | Main `#main-container` (dark) | `InnerMain tone="dark"` | over the header | — |
| 2a | Contact form (Name, Email, Phone Number, Message, Send) | `ContactForm` | flow | local validation + demo notice |
| 2b | Info row: Email / Phone / Address details, inert "Google Maps →", "STOCKHOLM" fit text (desktop), image (no corner markers) | `ArrowLink`-styled note, `FitText`, `ParallaxImage corners={false}` | tablet/desktop: 80vh row with details overlaid and centred; phone: stacked, image 400px | parallax |
| 2c | Closing lead + body | `LeadText` | flow | static |
| 3 | Footer | `SiteFooter` | revealed | — |
