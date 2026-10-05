# MeetTheTeam + RotatingBadge

## MeetTheTeam
- **Identity:** `/about` · `about-979bddc4/MeetTheTeam.tsx` · `about-979bddc4/team.module.css` · evidence `tools/`: `teamrate.mjs`, `teamhover.mjs`, `teampos.mjs`, `meet.mjs`, `teamhover-crop.jpg`.
- **Structure:** `section#meet-the-team[aria-labelledby]` → sticky title box → `h2` (visually hidden "Meet the Team" + `FitText align=center` "MEET / THE TEAM") → `ul` layer of 9 `li` (left %, top px, rate, z) → card link to `/team/<slug>` with portrait and name/role.
- **Content:** order and scatter values from `team.ts` (Erik Lindholm, Linnea Sörensen, Freja Karlsson, Mikael Andersson, Astrid Nilsen, Elin Jørgensen, Sofia Bergström, Oskar Bjørnsen, Jonas Eklund).
- **Layout (M):** desktop section 360vh (100vh title + 260vh layer); cards 15% wide (189×252 at 1440); fit text viewBox 1074.5×388, 215.55px, −0.04em, 90%, weight 900. Tablet 3-column grid; phone single column.
- **Motion:** `--nd-team-d = max(0, −sectionTop)`; each card translateY(d × rate). Hover 0.5s.
- **Accessibility:** one link per member with name; decorative fit text hidden.
- **Acceptance:** member offsets equal the reference at three viewport heights; section height Δ ≤ 1px at 700/1100 after the 260vh fix.

## RotatingBadge
- `about-979bddc4/RotatingBadge.tsx` — SVG `textPath` on a 100-unit circle, 12.9px / 600 / 0.2em tracking, white; CSS rotation −360° per 8s; `prefers-reduced-motion` stops it. Size rules in `about.module.css` (`.badge`).
