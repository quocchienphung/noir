# `/projects` — behaviors

- **Scroll (desktop, M):** each card is 80vh and sticks at top 160px (independent of viewport height — checked at 700 / 900 / 1100). While the element after it (next card, or the Archive block for Ström Haus) rises over it, the card's frame insets from 0 to 20% per side (scale 0.6) with the name kept in place and clipped; reached at full cover. The source lags this value slightly behind the scroll (spring smoothing, I); local tracks scroll directly — sampled frame widths differ by ≤ 16px mid-transition (`stackmeas.mjs`).
- **Scroll (tablet/phone, M):** cards in flow, 80vh tall, "View Project →" link visible on each card.
- **Archive (desktop, M):** title +30px and list +100px/opacity appear over 1s, replaying on re-entry.
- **Hover (fine pointer):** cards show the VIEW PROJECT follower; links roll.
- **Click:** cards → `/projects/<slug>`; each archive row links to an external framer.com referral URL on the source (M) — external-only, so rendered as plain rows here.
- **Not observed:** horizontal scrolling, filtering, pagination.
- **Verification:** `compare/{1440,1024,390}-y*.jpg`, `qa-routes` heights, `frameh.mjs` (viewport-height variance: Δ ≤ 2px at 700 and 1100).
