# Public Cards Almanac reference

Origin: [GetLayers Cards Almanac](https://www.getlayers.ai/sections?layer=cards-almanac), inspected 2026-10-06.

| Local artifact | Purpose |
| --- | --- |
| `public-preview.mp4` | Public 2.93 s, 1920×1366, 30 fps preview; inspect motion, never import into app runtime. |
| `public-poster.webp` | Public preview poster; settled stack composition. |
| `contact-sheet.jpg` | Fifteen sampled views in reading order, with seek labels. |
| `frames/t-00.00.png` | Header, first card and overall initial proportions. |
| `frames/t-00.60.png` | Second card overlaps first. |
| `frames/t-01.40.png` | Third card settled; older narrow edges visible. |
| `frames/t-02.00.png` | Fourth card settled; layered stack. |
| `frames/t-02.80.png` | Further card begins entry; final release not shown. |
| `manifest.json` | Public URLs, file sizes, SHA-256 hashes and the full 15-frame list. |
| `ffmpeg-metadata.txt` | Clip metadata; the probe's missing-output message is expected. |
| `protected-code-baseline.json` | Working-file hashes for approved black-hole/intro/cinematic source at prompt creation. |

All frames are raster samples of the public recording. Original component CSS, paid prompt/source, exact breakpoint, easing, scroll duration and plus-button action were not obtained. Metadata-panel UI is outside the target section. Seek times are requested decode locations, not the original scroll progress or verified frame PTS.

Public preview artwork is visual reference, not the user's portfolio artwork. Use real authored website previews or honest empty slots in production. Do not serve this clip, its poster or full-card screenshot as a fake coded section. Keep these files outside `public/` unless there is a separate authorized reason to publish a reference.

Reproduction helper: `scripts/extract-cards-almanac-reference.py`, requires Python/Pillow, a local downloaded clip and an ffmpeg executable. Example from repository root:

```powershell
python scripts/extract-cards-almanac-reference.py --ffmpeg 'C:/path/to/ffmpeg.exe' --clip 'C:/Users/quocc/Downloads/cards-almanac.mp4'
```

The helper refuses to replace an existing differing preview. The full manifest is the authoritative sample list.
