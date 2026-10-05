# Media provenance and rights

Every file served from `public/` is listed here. `tests/qa-independence.mjs` fails if a file under
`public/sites/noir/` is missing from this list, or if any served file is a copy of a reference capture.

## Brand mark (source: `prompt/logo.png`, supplied by the user as the NOIR logo)

The mark is the user's own artwork. It is not redrawn as a vector. `scripts/build-noir-brand.mjs`:
1. crops a 290 px square around the burst;
2. fades out the screenshot's rounded-corner artefacts radially;
3. uses luminance as alpha, so grain, glow and silhouette are preserved.

Re-run with `node scripts/build-noir-brand.mjs`.

| File | Notes |
| --- | --- |
| `/sites/noir/brand/noir-mark-light-64.png`, `/sites/noir/brand/noir-mark-light-128.png`, `/sites/noir/brand/noir-mark-light-256.png`, `/sites/noir/brand/noir-mark-light-512.png` | ivory mark on transparent; used by `NoirMark` (srcset) on dark grounds |
| `/sites/noir/brand/noir-mark-light-1024.png`, `/sites/noir/brand/noir-mark-light-1024.webp` | large master for print/press and future hero use |
| `/sites/noir/brand/noir-mark-dark-64.png`, `/sites/noir/brand/noir-mark-dark-128.png`, `/sites/noir/brand/noir-mark-dark-256.png`, `/sites/noir/brand/noir-mark-dark-512.png` | ink mark on transparent, for light grounds (`variant="dark"`) |
| `/sites/noir/brand/noir-mark-small-16.png`, `/sites/noir/brand/noir-mark-small-32.png`, `/sites/noir/brand/noir-mark-small-48.png` | small sizes with mid-tones lifted (γ 0.62), so the petals read at 16–48 px; same silhouette |
| `/sites/noir/seo/favicon-32.png`, `/sites/noir/seo/apple-touch-icon.png`, `/sites/noir/seo/icon-192.png`, `/sites/noir/seo/icon-512.png` | mark on `#050505` tiles |
| `/sites/noir/seo/site.webmanifest` | written by hand |
| `/sites/noir/seo/og-image.jpg` | 1200×630, composed from the cinematic poster below, the mark and Albert Sans text, then captured headlessly |

## Rendered media (NOIR's own WebGL renderer)

| File | Notes |
| --- | --- |
| `/sites/noir/media/dive-poster.jpg` | intro scene at p = 0, rendered by `BlackHoleRenderer` (1600×1000 @1.5×, resized to 1920×1200). Fallback when WebGL2 is unavailable or the context is lost. |
| `/sites/noir/media/cinematic-poster.jpg` | cinematic scene at q = 0.5 (frame open), same process |

No third-party imagery or footage is used. The renderer is original code in
`src/lib/noir/blackhole/`.

## Fonts

| File | Notes |
| --- | --- |
| `/sites/noir/fonts/albert-sans-variable-400.woff2`, `/sites/noir/fonts/albert-sans-v4-latin-400-600.woff2`, `/sites/noir/fonts/albert-sans-500.woff2`, `/sites/noir/fonts/albert-sans-700.woff2` | Albert Sans by Andreas Rasmussen, SIL Open Font License 1.1. Carried over from the previous build and self-hosted. |

## References (research only, never served)

- **Eventide** (https://eventide.framer.ai/): frames in `docs/design-references/noir/eventide/`, used
  for layout and timing analysis only (see `REFERENCE_EVENTIDE.md`).
- **YouTube 784dsKVrdjQ**, "Interstellar Gargantua Black Hole | 1 Hour Full HD Live Wallpaper": four
  frames at 0:00, 0:15, 0:45 and 1:30 in `docs/design-references/noir/gargantua-video/`. They were
  captured from the public watch page to analyse composition, disk tilt, lensing and colour. The video
  is **not** downloaded, embedded, hotlinked or re-encoded. Its rights belong to its owners (the
  imagery derives from *Interstellar*, © Warner Bros./Paramount). If licensed footage becomes
  available, it could replace the renderer in the cinematic frame.
- **Previous-site captures** (`docs/design-references/noir/bug/`): screenshots of the old build,
  documenting the bug.

## Removed

The previous site's media namespace (`public/sites/norda-framer-website-3f1ea7cb/`: architecture
photography, water video, wave logos, favicons) was removed from `public/` once nothing referenced it.
It remains in git history.
