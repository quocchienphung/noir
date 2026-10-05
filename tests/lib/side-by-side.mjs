#!/usr/bin/env node
// Side-by-side comparison image: node tests/lib/side-by-side.mjs <left> <right> <out.jpg> [width=960]
// Both inputs are fitted to the same 16:9 box (no stretching beyond aspect-preserving cover).
import sharp from "sharp";

const [a, b, out, w = "960"] = process.argv.slice(2);
const W = Number(w);
const H = Math.round((W * 9) / 16);
const fit = (f) => sharp(f).removeAlpha().resize(W, H, { fit: "cover" }).toBuffer();
const [A, B] = await Promise.all([fit(a), fit(b)]);
await sharp({ create: { width: W * 2 + 6, height: H, channels: 3, background: "#ff00ff" } })
  .composite([{ input: A, left: 0, top: 0 }, { input: B, left: W + 6, top: 0 }])
  .jpeg({ quality: 88 })
  .toFile(out);
