# `/news` — behaviors

- **Scroll (M):** header half-speed; card covers parallax −300px → 0.
- **Hover (fine pointer):** cover shows READ ARTICLE follower; "Read Article →" rolls.
- **Click:** cover and "Read Article" both open `/news/<slug>`; the cover link is `tabIndex=-1` so keyboard users get one stop per card.
- **Responsive (M):** "Read Article" is 28/33.6 (phone) and 32/38.4 (tablet) in the variable face at "wght" 500, 36/43.2 Albert 500 on desktop; info row padding 32 / 56 / 64.
- **Deep link:** `/news#main-container` lands with the panel at the top (scroll-margin 0 — the 90px margin belongs to the home page only).
- **Not observed:** pagination, categories, filters.
