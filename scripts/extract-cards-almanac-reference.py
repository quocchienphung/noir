"""Archive the publicly displayed Cards Almanac preview for research, not runtime."""
import argparse
import hashlib
import json
import shutil
import subprocess
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageOps


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ffmpeg", required=True)
    parser.add_argument("--clip", type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    dest = root / "prompt/references/cards-almanac"
    dest.mkdir(parents=True, exist_ok=True)
    clip = dest / "public-preview.mp4"
    if clip.exists():
        if hashlib.sha256(clip.read_bytes()).digest() != hashlib.sha256(args.clip.read_bytes()).digest():
            raise RuntimeError("Existing preview differs; preserve it and inspect before replacing.")
    else:
        shutil.copy2(args.clip, clip)
    poster = dest / "public-poster.webp"
    if not poster.exists():
        request = urllib.request.Request(
            "https://storage.getlayers.ai/sections/cards-almanac.webp",
            headers={"User-Agent": "Mozilla/5.0"},
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            poster.write_bytes(response.read())
    probe = subprocess.run([args.ffmpeg, "-hide_banner", "-i", str(clip)], capture_output=True, text=True)
    (dest / "ffmpeg-metadata.txt").write_text(probe.stderr, encoding="utf-8")
    # The public recording is 2.93 seconds: dense samples reveal the stacking handoff.
    times = [round(i / 5, 2) for i in range(15)]
    frames = dest / "frames"
    frames.mkdir(exist_ok=True)
    records = []
    thumbs = []
    for t in times:
        frame = frames / f"t-{t:05.2f}.png"
        subprocess.run([args.ffmpeg, "-hide_banner", "-loglevel", "error", "-ss", str(t),
                        "-i", str(clip), "-frames:v", "1", "-y", str(frame)], check=True)
        if not frame.exists():
            continue
        with Image.open(frame) as image:
            dims = image.size
            thumb = Image.new("RGB", (480, 362), "#171717")
            fitted = ImageOps.contain(image.convert("RGB"), (480, 338))
            thumb.paste(fitted, ((480-fitted.width)//2, 24+(338-fitted.height)//2))
            ImageDraw.Draw(thumb).text((10, 6), f"Almanac public preview | seek {t:.2f}s", fill="white")
            thumbs.append(thumb)
            records.append({"seek_seconds": t, "path": frame.relative_to(root).as_posix(), "size": dims})
    rows = (len(thumbs)+3)//4
    sheet = Image.new("RGB", (1920, 362*rows), "#171717")
    for i, thumb in enumerate(thumbs):
        sheet.paste(thumb, ((i % 4)*480, (i // 4)*362))
    sheet.save(dest / "contact-sheet.jpg", quality=94)
    records_media = []
    for path, url in [(clip, "https://storage.getlayers.ai/sections/cards-almanac.mp4"),
                      (poster, "https://storage.getlayers.ai/sections/cards-almanac.webp")]:
        records_media.append({"url": url, "path": path.relative_to(root).as_posix(),
                              "bytes": path.stat().st_size, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
    manifest = {"purpose": "Public visual reference only; no Premium prompt/source extracted; do not import scene footage into runtime.",
                "page": "https://www.getlayers.ai/sections?layer=cards-almanac",
                "captured_date": "2026-10-06", "media": records_media, "frames": records,
                "timestamp_note": "Requested ffmpeg seek time, not independently verified frame PTS or original scroll progress."}
    (dest / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"folder": str(dest), "frames": len(records), "media": len(records_media)}))


if __name__ == "__main__":
    main()
