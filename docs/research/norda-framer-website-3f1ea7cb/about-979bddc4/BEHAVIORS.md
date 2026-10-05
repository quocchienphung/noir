# `/about` — behaviors

- **Badge (M):** rotates counter-clockwise, 8s per turn, time-driven; size 40% / 24% / 12% of the image frame width, inset by the gutter (fixed 2026-10-05 from 120/180/223px).
- **Meet the Team (desktop, M):** title "MEET / THE TEAM" (Albert 900, centred lines) stays sticky for 100vh while the 9 portraits (15% wide, aspect 0.7535) scroll past at authored positions; once the section top passes the viewport top each portrait drifts by `d × rate` (rates −0.214…0.171). Hover/focus: card scale 0.96 → 1 and name fades/rises in 0.5s.
- **Meet the Team (tablet/phone, M):** static grid / column, names always visible.
- **Publications (desktop, M):** each row rises 100px + fades in on entering view, replays.
- **Deep links:** `/about#job-openings` and `/about#meet-the-team` land with the target at the viewport top (verified in `qa-behaviors`).
- **Hover:** links roll; portraits show the dot follower.
- **Verification:** `compare/*`, `badge2.mjs`, `teampos.mjs` (positions equal at 700/900/1100 viewport heights), `qa-behaviors` deep links.
