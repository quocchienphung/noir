# `/contact` — behaviors

- **Form (local demo):** empty submit marks all four fields invalid ("Required") and focuses Name; an invalid email shows "Enter a valid email"; a valid submission resets the form and shows "Demo only — this local reconstruction did not send your message." Nothing is posted (`qa-behaviors` records zero POST requests). The source posts to a Framer form endpoint; it was not submitted during research (instruction), so the source success state is unverified (U).
- **Fields (M):** 24px Albert 500, padding 16 48 16 0, 1px `#777` underline turning white on focus, box 61px tall, 32px apart.
- **Google Maps:** external-only on the source (maps.google.com) → inert `role="note"` with an explanatory title.
- **Email / phone values:** the source links them to placeholder targets (`mailto:hello@world.com`, `tel:000000`) — external-only, so rendered as text with an explanatory `title`.
- **Image:** parallax, full content width on phone (fixed 2026-10-05), no corner markers.
- **Hover:** Send button arrow disc; links roll.
