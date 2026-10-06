#!/usr/bin/env node
// Contact sheet: node tests/lib/sheet.mjs <out.png> <cols> <tileWidth> <in1> [in2 …] (tiles keep in1's aspect)
import sharp from "sharp";

const [out, cols, tw, ...ins] = process.argv.slice(2);
const C = Number(cols), W = Number(tw);
const m = await sharp(ins[0]).metadata();
const H = Math.round((W * m.height) / m.width);
const tiles = await Promise.all(ins.map(async (f, i) => ({ input: await sharp(f).resize(W, H).toBuffer(), left: (i % C) * W, top: Math.floor(i / C) * H })));
await sharp({ create: { width: W * C, height: H * Math.ceil(ins.length / C), channels: 3, background: "#202020" } }).composite(tiles).png().toFile(out);
