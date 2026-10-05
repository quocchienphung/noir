// Derives every NOIR brand raster from the supplied mark (prompt/logo.png): transparent light/dark marks,
// a contrast-boosted small mark for favicons, and the apple/manifest icons. Run: node scripts/build-noir-brand.mjs
// The burst is kept exactly as drawn — no vector redraw; alpha comes from the source luminance so the grain,
// soft petals and bright core survive on any background.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const SRC = "prompt/logo.png";
const OUT = "public/sites/noir/brand";
// Square crop centred on the burst (MEASURED: luminance bbox 50,60 → 269,311; centroid ≈ 163,187).
const CROP = { left: 15, top: 42, width: 290, height: 290 };

await mkdir(OUT, { recursive: true });

/** Greyscale luminance of the crop with the screenshot's rounded-corner artefacts faded out radially. */
async function luminance(size) {
  const { data, info } = await sharp(SRC)
    .extract(CROP)
    .removeAlpha()
    .greyscale()
    .resize(size, size, { kernel: "lanczos3" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height);
  const c = (size - 1) / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c) / size;
      const fade = d < 0.44 ? 1 : d > 0.5 ? 0 : 1 - (d - 0.44) / 0.06;
      const v = Math.max(0, data[y * size + x] - 5) * (255 / 250);
      out[y * size + x] = Math.min(255, Math.round(v * fade));
    }
  }
  return out;
}

/** RGBA buffer with a flat colour and alpha from luminance (optionally gamma-lifted for small sizes). */
function tinted(lum, size, rgb, gamma = 1) {
  const buf = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    buf[i * 4] = rgb[0];
    buf[i * 4 + 1] = rgb[1];
    buf[i * 4 + 2] = rgb[2];
    buf[i * 4 + 3] = Math.round(255 * Math.pow(lum[i] / 255, gamma));
  }
  return sharp(buf, { raw: { width: size, height: size, channels: 4 } });
}

const IVORY = [255, 253, 248];
const INK = [8, 8, 8];

for (const size of [1024, 512, 256, 128, 64]) {
  const lum = await luminance(size);
  await tinted(lum, size, IVORY).png({ compressionLevel: 9 }).toFile(`${OUT}/noir-mark-light-${size}.png`);
  if (size <= 512) await tinted(lum, size, INK).png({ compressionLevel: 9 }).toFile(`${OUT}/noir-mark-dark-${size}.png`);
}
// WebP for the large in-page uses (hero/media centre mark).
await tinted(await luminance(1024), 1024, IVORY).webp({ quality: 90, alphaQuality: 95 }).toFile(`${OUT}/noir-mark-light-1024.webp`);

// Small sizes: lift mid-tones so the petals still read at 16–48 px (same silhouette, no redraw).
for (const size of [48, 32, 16]) {
  const big = await luminance(size * 8);
  const small = await sharp(big, { raw: { width: size * 8, height: size * 8, channels: 1 } })
    .resize(size, size, { kernel: "lanczos3" })
    .raw()
    .toBuffer();
  await tinted(small, size, IVORY, 0.62).png().toFile(`${OUT}/noir-mark-small-${size}.png`);
}

// Opaque icons on near-black (favicon, apple-touch, manifest) with the mark at ~78 % of the tile.
async function icon(size, file, scale = 0.78) {
  const inner = Math.round(size * scale);
  const lum = await luminance(Math.max(inner, 64) * (inner < 64 ? 4 : 1));
  const markBuf = await tinted(lum, Math.max(inner, 64) * (inner < 64 ? 4 : 1), IVORY, inner < 64 ? 0.62 : 0.85)
    .resize(inner, inner, { kernel: "lanczos3" })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 5, g: 5, b: 5, alpha: 1 } } })
    .composite([{ input: markBuf, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toFile(file);
}

await mkdir("public/sites/noir/seo", { recursive: true });
await icon(32, "public/sites/noir/seo/favicon-32.png", 0.96);
await icon(180, "public/sites/noir/seo/apple-touch-icon.png");
await icon(192, "public/sites/noir/seo/icon-192.png");
await icon(512, "public/sites/noir/seo/icon-512.png");

console.log("NOIR brand rasters written to", OUT, "and public/sites/noir/seo");
