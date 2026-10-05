#!/usr/bin/env node
// Sharpness matrix for the black hole on the real page at default quality (MASTER PROMPT V2 §13.1).
// Usage: node tests/qa-blackhole-sharpness.mjs [baseUrl=http://localhost:3000] [label=sharpness]
// For every viewport (CSS size × DPR): hero at p = 0 / 0.25 / 0.5 and cinematic framed / open, after the
// adaptive quality has settled. Records the traced buffer, output size, tier and frame pacing (rAF
// intervals over 90 frames), writes lossless device-pixel PNGs to docs/design-references/noir/black-hole-v2/<label>/
// and checks:
//   S1 the canvas outputs at device resolution (output = canvas CSS size × min(DPR, 2), as the renderer caps it)
//   S2 the traced buffer is at least 50 % of the output on each axis (never more than a 2× upscale)
//   S3 frames keep pace: median rAF interval ≤ max(1.25 × display interval, 17.5 ms) — the budget aims at
//      ~60 fps of GPU work, so on a 120–165 Hz display the hero settles at about half the refresh rate
// Query overrides (bhT, bhPtr) are dev-only; on a production server the page runs with live time.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const base = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] || "sharpness";
const OUT = path.join(ROOT, "docs/design-references/noir/black-hole-v2", label);
fs.mkdirSync(OUT, { recursive: true });
const viewports = [
  [1440, 900, 1],
  [1920, 1080, 1],
  [2560, 1440, 1],
  [390, 844, 3],
  [2035, 1032, 1.25], // the user's screenshot viewport (2544 × 1290 device px)
];
const shots = [
  ["hero-p000", 0, 0],
  ["hero-p025", 0, 0.25],
  ["hero-p050", 0, 0.5],
  ["cinematic-framed", 2, 0],
  ["cinematic-open", 2, 0.43],
];
const failures = [];
const rows = [];

const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
for (const [w, h, dpr] of viewports) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  await page.goto(`${base}/?bhT=12&bhPtr=0`, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("canvas")?.dataset.ready !== undefined, null, { timeout: 60000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(6000); // adaptive quality settles (measured: stable from ~5 s)
  const vsync = await page.evaluate(
    () => new Promise((res) => { const ts = []; const f = (t) => { ts.push(t); if (ts.length < 31) requestAnimationFrame(f); else { const d = ts.slice(1).map((x, i) => x - ts[i]).sort((a, b) => a - b); res(d[3]); } }; requestAnimationFrame(f); }),
  );
  for (const [name, index, k] of shots) {
    const y = await page.evaluate(
      ([i, k]) => {
        const t = document.querySelectorAll("main > section")[i];
        const r = t.getBoundingClientRect();
        return r.top + scrollY + k * (r.height - innerHeight);
      },
      [index, k],
    );
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(2500);
    const info = await page.evaluate(() => {
      const cs = [...document.querySelectorAll("canvas")].filter((c) => {
        const r = c.getBoundingClientRect();
        return r.width > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(c).visibility !== "hidden";
      });
      const c = cs[0];
      if (!c) return null;
      const r = c.getBoundingClientRect();
      return { buffer: c.dataset.buffer, output: c.dataset.output, scale: c.dataset.scale, tier: c.dataset.tier, gpuMs: c.dataset.gpuMs ?? null, css: [r.width, r.height] };
    });
    const pace = await page.evaluate(
      () => new Promise((res) => { const ts = []; const f = (t) => { ts.push(t); if (ts.length < 91) requestAnimationFrame(f); else { const d = ts.slice(1).map((x, i) => x - ts[i]).sort((a, b) => a - b); res({ median: +d[45].toFixed(2), p95: +d[85].toFixed(2), max: +d[89].toFixed(2) }); } }; requestAnimationFrame(f); }),
    );
    const file = `${w}x${h}@${dpr}-${name}.png`;
    await page.screenshot({ path: path.join(OUT, file), type: "png" });
    const row = { viewport: `${w}x${h}@${dpr}`, shot: name, vsync: +vsync.toFixed(2), ...info, frameMs: pace, file };
    rows.push(row);
    console.log(JSON.stringify(row));
    if (!info) {
      failures.push(`${row.viewport} ${name}: no visible canvas`);
      continue;
    }
    const [bw, bh] = info.buffer.split("x").map(Number);
    const [ow, oh] = info.output.split("x").map(Number);
    const ew = Math.round(info.css[0] * Math.min(dpr, 2));
    // the renderer follows a transform-driven size in > 4 % steps: never smaller than shown, ≤ 5 % larger
    if (ow < ew - 2 || ow > ew * 1.05 + 2) failures.push(`S1 ${row.viewport} ${name}: output ${info.output}, expected width ${ew}`);
    if (bw < 0.5 * ow || bh < 0.5 * oh) failures.push(`S2 ${row.viewport} ${name}: buffer ${info.buffer} for output ${info.output}`);
    if (pace.median > Math.max(1.25 * vsync, 17.5)) failures.push(`S3 ${row.viewport} ${name}: median frame ${pace.median} ms at a ${vsync.toFixed(2)} ms display`);
  }
  await ctx.close();
}
await browser.close();

// contact sheet (downscaled for overview only; the PNGs above are the evidence)
const tiles = [];
for (const [i, row] of rows.entries()) {
  const col = i % shots.length, line = Math.floor(i / shots.length);
  tiles.push({ input: await sharp(path.join(OUT, row.file)).resize(320, 200, { fit: "contain", background: "#ff00ff" }).toBuffer(), left: col * 324, top: line * 204 });
}
await sharp({ create: { width: 324 * shots.length, height: 204 * viewports.length, channels: 3, background: "#ff00ff" } }).composite(tiles).jpeg({ quality: 85 }).toFile(path.join(OUT, "matrix.jpg"));
fs.writeFileSync(path.join(OUT, "metrics.json"), JSON.stringify(rows, null, 1));
if (failures.length) {
  console.log(`FAIL (${failures.length})\n` + failures.join("\n"));
  process.exit(1);
}
console.log("PASS");
