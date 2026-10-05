#!/usr/bin/env node
// Motion QA for the black-hole gas at a fixed camera (needs `next dev`: uses /qa/black-hole + bhT).
// Usage: node tests/qa-blackhole-motion.mjs [baseUrl=http://localhost:3000] [scene=cinematic] [p=0.43] [v2 label]
// Steps simulation time 0 → 36 s (past any phase boundary) and records, per frame:
//   mean luma of the frame and of an inner-disk region      → no global pulsing / phase flashes
//   mean |Δ| to the previous frame                         → continuous motion, no seams or pops
// Also renders the same time twice (frozen-time determinism: no boiling noise, no seed reset) and
// writes an animated WebP of the sequence. Output: docs/design-references/noir/black-hole-rebuild/motion/.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const base = process.argv[2] || "http://localhost:3000";
const scene = process.argv[3] || "cinematic";
const p = process.argv[4] || "0.43";
const OUT = process.argv[5] ? path.join(ROOT, "docs/design-references/noir/black-hole-v2", process.argv[5]) : path.join(ROOT, "docs/design-references/noir/black-hole-rebuild/motion");
fs.mkdirSync(OUT, { recursive: true });
const W = 960, H = 540, DT = 1.0, T1 = 36;

const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H } });
const page = await ctx.newPage();
const shot = async (t) => {
  await page.goto(`${base}/qa/black-hole?scene=${scene}&p=${p}&bhT=${t}&bhPtr=0&bhQ=high&bhScale=1&bhGrain=0`, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("canvas")?.dataset.ready !== undefined, null, { timeout: 30000 });
  await page.waitForTimeout(900); // the canvas fades in over 0.6 s (black-hole.module.css)
  return page.screenshot({ type: "png" });
};
const lumaStats = async (buf) => {
  const { data, info } = await sharp(buf).greyscale().raw().toBuffer({ resolveWithObject: true });
  let all = 0;
  let inner = 0, ni = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const v = data[y * info.width + x];
      all += v;
      // inner region: a box around the frame centre-right where the shadow edge and inner arcs sit
      if (x > info.width * 0.55 && x < info.width * 0.95 && y > info.height * 0.2 && y < info.height * 0.85) {
        inner += v;
        ni++;
      }
    }
  return { data, mean: all / data.length, inner: inner / ni };
};

const frames = [];
let prev = null;
const series = [];
for (let t = 0; t <= T1 + 1e-9; t += DT) {
  const buf = await shot(t.toFixed(2));
  const st = await lumaStats(buf);
  let dmean = null;
  if (prev) {
    let d = 0;
    for (let i = 0; i < st.data.length; i++) d += Math.abs(st.data[i] - prev[i]);
    dmean = d / st.data.length;
  }
  prev = st.data;
  series.push({ t: +t.toFixed(2), mean: +st.mean.toFixed(2), inner: +st.inner.toFixed(2), deltaToPrev: dmean === null ? null : +dmean.toFixed(3) });
  frames.push(await sharp(buf).resize(640, 360).png().toBuffer());
}
// frozen-time determinism
const a = await lumaStats(await shot("12.00"));
const b = await lumaStats(await shot("12.00"));
let same = 0;
for (let i = 0; i < a.data.length; i++) same += Math.abs(a.data[i] - b.data[i]);
await browser.close();

const means = series.map((s) => s.mean);
const inner = series.map((s) => s.inner);
const deltas = series.map((s) => s.deltaToPrev).filter((d) => d !== null);
const stat = (v) => {
  const m = v.reduce((x, y) => x + y, 0) / v.length;
  const sd = Math.sqrt(v.reduce((x, y) => x + (y - m) ** 2, 0) / v.length);
  return { mean: +m.toFixed(2), sd: +sd.toFixed(3), min: +Math.min(...v).toFixed(2), max: +Math.max(...v).toFixed(2) };
};
const dStat = stat(deltas);
const summary = {
  scene, progress: +p, seconds: T1, step: DT,
  frameLuma: stat(means), innerLuma: stat(inner), deltaToPrev: dStat,
  // a seam/pop would show as one Δ far above its neighbours
  maxDeltaOverMedian: +(Math.max(...deltas) / [...deltas].sort((x, y) => x - y)[deltas.length >> 1]).toFixed(2),
  frozenTimeMeanAbsDiff: +(same / a.data.length).toFixed(4),
  series,
};
fs.writeFileSync(path.join(OUT, `motion-${scene}-${p}.json`), JSON.stringify(summary, null, 1));
await sharp(frames, { join: { animated: true } }).webp({ quality: 70, delay: 120, loop: 0 }).toFile(path.join(OUT, `motion-${scene}-${p}.webp`));
console.log(JSON.stringify({ ...summary, series: undefined }, null, 1));
