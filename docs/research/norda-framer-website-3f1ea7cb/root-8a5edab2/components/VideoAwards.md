# VideoAwards — video statement + Awards

- **Identity:** `/` · `root-8a5edab2/VideoAwards.tsx` · `root-8a5edab2/video-awards.module.css` · evidence `tools/`: `wave.mjs`, `crafting*.mjs` (statement geometry), `design-references/<site>/root-8a5edab2/scroll/`, `compare/*-y3600.jpg`, `*-y4500.jpg`.
- **Structure:** section → layers: video layer (frame + looping muted `video`), wave-mark layer (desktop), white text layer (sticky `h2` with visually hidden text + two `FitText clip` variants: 4 lines desktop/tablet, 7 lines phone) → flow column: spacer (250vh desktop) + white Awards panel (`RecordList` with count "/  8").
- **Content:** "Crafting spaces / where natural beauty / meets timeless, functional / design for inspired living."; 8 awards (title, organisation, year, preview image) in `home.ts`.
- **Assets:** local MP4 `RPCvbH4eTYU7lPNivoY0mYV63qw` (autoplay, muted, loop, `preload=metadata`), 8 award preview images (see `ASSET_MANIFEST.json`).
- **Layout (M):** statement fit text viewBox 1200×490 at 108.79px / −0.04em / 90%; box ratio 2.7772 on desktop (SVG 1312×536, clipped) and 334px tall on tablet (SVG 928×379, clipped); phone viewBox 342×348 at 51.19px.
- **Motion (desktop, M):** over the first 50vh of the stage, frame scale 0.66 → 1, inner video 1.2 → 1, wave mark opacity 1 → 0; statement sticky; Awards title +30px and list +100px/opacity appear (1s, replays).
- **Input:** scroll; fine-pointer hover over award rows shows the preview (cursor `award-n`).
- **Accessibility:** statement text exposed once; video muted, decorative (`aria-hidden`), `playsInline`; reduced motion stops scaling.
- **Acceptance:** statement line rects equal the reference at 1440 and 1024 (`crafting2.mjs`); visual frames differ only inside the moving video (time-based).
- **Uncertainty:** video frames cannot be time-aligned between sites; their area is excluded from conclusions, not masked.
