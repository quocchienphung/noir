"""Copy user references and extract timestamped research stills; never production assets.

Usage: python scripts/extract-noir-journey-references.py --ffmpeg PATH
Requires Pillow and an existing ffmpeg executable. Source MP4s are not modified.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess

from PIL import Image, ImageDraw, ImageOps


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--ffmpeg", required=True)
    parser.add_argument("--downloads", type=Path, default=Path.home() / "Downloads")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    dest = root / "prompt" / "references" / "spacetime"
    dest.mkdir(parents=True, exist_ok=True)
    inputs = [
        ("hero-lensing", "SaveThreads.com_Threads_Cosmoknowledge-s-Media_3356290825280265221_001_720p.mp4"),
        ("cinematic-closeup", "SaveThreads.com_Threads_Space-Science-s-Media_3616417251080442943_001_360p.mp4"),
    ]
    times = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]
    manifest = {"purpose": "Research only. Never import these frames or videos into runtime.", "media": []}
    for key, filename in inputs:
        src = args.downloads / filename
        local = dest / (key + ".mp4")
        shutil.copy2(src, local)
        probe = subprocess.run([args.ffmpeg, "-hide_banner", "-i", str(local)], capture_output=True, text=True)
        (dest / (key + "-ffmpeg.txt")).write_text(probe.stderr, encoding="utf-8")
        frames = dest / (key + "-frames")
        frames.mkdir(exist_ok=True)
        thumbs = []
        records = []
        for t in times:
            frame = frames / f"t-{t:02d}.png"
            subprocess.run([args.ffmpeg, "-hide_banner", "-loglevel", "error", "-ss", str(t), "-i", str(local),
                            "-frames:v", "1", "-y", str(frame)], check=True)
            with Image.open(frame) as im:
                dims = im.size
                cellsize = (240, 450) if key == "hero-lensing" else (320, 204)
                thumb = Image.new("RGB", cellsize, "#171717")
                resized = ImageOps.contain(im.convert("RGB"), (cellsize[0], cellsize[1] - 24))
                thumb.paste(resized, ((cellsize[0] - resized.width) // 2, 24))
                ImageDraw.Draw(thumb).text((8, 6), f"{key} | {t:02d}.00 s", fill="white")
                thumbs.append(thumb)
                records.append({"seek_seconds": t, "path": frame.relative_to(root).as_posix(), "size": dims})
        sheet = Image.new("RGB", (thumbs[0].width * 4, thumbs[0].height * 3), "black")
        for i, thumb in enumerate(thumbs):
            sheet.paste(thumb, ((i % 4) * thumb.width, (i // 4) * thumb.height))
        sheet.save(dest / (key + "-contact-sheet.jpg"), quality=94)
        manifest["media"].append({"id": key, "source": str(src), "local": local.relative_to(root).as_posix(),
                                  "bytes": local.stat().st_size, "sha256": hashlib.sha256(local.read_bytes()).hexdigest(),
                                  "frames": records})
    src = args.downloads / "int_bookcase-580x422.jpg"
    shutil.copy2(src, dest / "tesseract-bookcase.jpg")
    manifest["image"] = {"source": str(src), "local": "prompt/references/spacetime/tesseract-bookcase.jpg",
                         "sha256": hashlib.sha256(src.read_bytes()).hexdigest()}
    (dest / "manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"folder": str(dest), "clips": len(inputs), "stills": len(inputs) * len(times)}))


if __name__ == "__main__":
    main()
