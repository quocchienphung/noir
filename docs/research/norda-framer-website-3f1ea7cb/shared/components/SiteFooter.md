# SiteFooter + NewsletterForm

- **Identity:** all routes · `shared/SiteFooter.tsx`, `shared/NewsletterForm.tsx` · `footer.module.css` · evidence: compact dumps `raw/*/compact-*.txt` (Footer subtree), scroll frames at page bottoms.
- **Structure:** wrapper (desktop reveal) → footer: wordmark image (aria-hidden), newsletter (`h2` + form with visually hidden label, email input, submit button, `role=status` message, disclaimer linking to `/privacy-policy`), sitemap `nav[aria-label=Sitemap]` (two columns of local links), utility row (social list, BACK TO TOP button), legal line.
- **Content:** "Sign up for our newsletter to receive updates and content" (non-breaking spaces after "to" and "and" — M), "Copyright 2026 Nordå. All rights reserved." (NBSP in "All rights" — M), "Framer template handcrafted by Anton Drukarov" (text only).
- **Layout (M):** desktop padding 64, gap 192, wordmark absolute + sticky at (100vh − h)/2; tablet padding 96 48 48, gap 144, wordmark in flow, 2-column sitemap; phone padding 64 24 24, gap 96, single column, utility rows stacked. Sitemap links 28/33.6 ls −0.28 · 32/38.4 ls −0.64 (variable "wght" 500) · 36/43.2 ls −1.08 (Albert 500).
- **State machine:** form `idle` → submit empty → `error` ("Please enter your email address.") → invalid → `error` ("Please enter a valid email address.") → valid → `demo` ("Demo only — this local reconstruction does not send or store your email."), input reset; typing returns to `idle`.
- **Motion:** desktop footer translateY −480px → 0 over its scroll travel, wordmark opacity 0 → 0.12; footer content fades in once (0.4s, 0.8s delay). Tablet/phone static.
- **Input:** pointer, keyboard (form + BACK TO TOP button), touch.
- **External-only links:** Facebook / X / Instagram glyphs are rendered as inert list items labelled "Social media (external links not included in this reconstruction)".
- **Accessibility:** labelled form, `aria-invalid`, `aria-describedby` → live status; BACK TO TOP scrolls smoothly unless reduced motion.
- **Acceptance:** `qa-behaviors` "newsletter …" and "footer: back to top"; zero POST requests recorded.
- **Uncertainty:** the source's real success state was not exercised (production form not submitted, per instructions) — U; local demo state is explicit.
