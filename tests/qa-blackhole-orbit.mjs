#!/usr/bin/env node
// 360° camera matrix for the black hole (MASTER PROMPT V2 §13.2). Needs `next dev` (/qa/black-hole).
// Usage: node tests/qa-blackhole-orbit.mjs [baseUrl=http://localhost:3000]
// Same renderer/material/seed as the hero; frozen gas time; radius 20 rs (hero). Writes per-view PNGs, a
// contact sheet and metrics to docs/design-references/noir/black-hole-v2/orbit/, and checks:
//   O1 every view renders (no black/NaN frame)                       O2 azimuth 360° ≡ 0° (closure)
//   O3 a vertical pass over the pole is continuous (no jump between 1° steps)
//   O4 face-on views (i = 0°, 180°) show no left/right Doppler asymmetry; edge-on views do
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const base = process.argv[2] || "http://localhost:3000";
const OUT = path.join(ROOT, "docs/design-references/noir/black-hole-v2/orbit");
fs.mkdirSync(OUT, { recursive: true });
const W = 800, H = 450;
const incs = [0, 30, 60, 85, 90, 95, 120, 150, 180];
const azs = [0, 90, 180, 270];
const failures = [];
const fail = (m) => failures.push(m);

const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
const render = async (inc, az, extra = "") => {
  await page.goto(`${base}/qa/black-hole?scene=dive&p=0&orbit=${inc},${az},20&bhT=12&bhPtr=0&bhQ=high&bhScale=1&bhGrain=0${extra}`, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("canvas")?.dataset.ready !== undefined, null, { timeout: 30000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(900);
  return page.screenshot({ type: "png" });
};
const stats = async (buf) => {
  const { data, info } = await sharp(buf).greyscale().raw().toBuffer({ resolveWithObject: true });
  let m = 0, left = 0, right = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++) {
      const v = data[y * info.width + x];
      m += v;
      if (x < info.width / 2) left += v;
      else right += v;
    }
  return { mean: m / data.length, lr: left / Math.max(1, right), data };
};

const metrics = {};
const tiles = [];
for (const [i, inc] of incs.entries()) {
  for (const [j, az] of azs.entries()) {
    const buf = await render(inc, az);
    const name = `i${String(inc).padStart(3, "0")}-a${String(az).padStart(3, "0")}`;
    fs.writeFileSync(path.join(OUT, `${name}.png`), buf);
    const st = await stats(buf);
    metrics[name] = { mean: +st.mean.toFixed(2), leftRight: +st.lr.toFixed(3) };
    if (!(st.mean > 2)) fail(`O1 ${name}: black frame (mean ${st.mean.toFixed(2)})`);
    tiles.push({ input: await sharp(buf).resize(320, 180).toBuffer(), left: j * 324, top: i * 184 });
  }
}
await sharp({ create: { width: 324 * azs.length, height: 184 * incs.length, channels: 3, background: "#ff00ff" } }).composite(tiles).jpeg({ quality: 86 }).toFile(path.join(OUT, "matrix.jpg"));

// O2 closure: 0° vs 360°
const a0 = await stats(await render(60, 0));
const a360 = await stats(await render(60, 360));
let d = 0;
for (let k = 0; k < a0.data.length; k++) d += Math.abs(a0.data[k] - a360.data[k]);
const closure = d / a0.data.length;
metrics.closure = +closure.toFixed(4);
if (closure > 0.5) fail(`O2 azimuth 360° differs from 0° (mean |Δ| ${closure.toFixed(3)})`);

// O3 pole continuity along the drag path: pitch the camera about its own right axis in 1° steps from
// inclination 6° over the pole to 6° on the far side (exactly what a vertical drag does)
const qx = (deg) => [Math.sin((deg * Math.PI) / 360), 0, 0, Math.cos((deg * Math.PI) / 360)];
const renderQ = async (q) => {
  await page.goto(`${base}/qa/black-hole?scene=dive&p=0&orbitq=${q.map((v) => v.toFixed(8)).join(",")},20&bhT=12&bhPtr=0&bhQ=high&bhScale=1&bhGrain=0`, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("canvas")?.dataset.ready !== undefined, null, { timeout: 30000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(700);
  return page.screenshot({ type: "png" });
};
// equator orientation is identity; pitching by +θ about right raises the camera to inclination 90° − θ
const seq = [];
for (let th = 84; th <= 96; th += 1) seq.push(await stats(await renderQ(qx(th))));
const jumps = [];
for (let k = 1; k < seq.length; k++) {
  let s = 0;
  for (let n = 0; n < seq[k].data.length; n++) s += Math.abs(seq[k].data[n] - seq[k - 1].data[n]);
  jumps.push(+(s / seq[k].data.length).toFixed(2));
}
metrics.poleSteps = jumps;
const medianJump = [...jumps].sort((a, b) => a - b)[jumps.length >> 1];
if (Math.max(...jumps) > Math.max(4, medianJump * 2.5)) fail(`O3 discontinuity crossing the pole: ${jumps.join(", ")}`);

// O4 Doppler asymmetry: face-on ~symmetric, edge-on clearly asymmetric
const faceOn = [metrics["i000-a000"].leftRight, metrics["i180-a000"].leftRight];
const edgeOn = metrics["i085-a000"].leftRight;
metrics.doppler = { faceOn, edgeOn };
if (faceOn.some((r) => Math.abs(r - 1) > 0.12)) fail(`O4 face-on view is lopsided (left/right ${faceOn.join(", ")})`);
if (Math.abs(edgeOn - 1) < 0.05) fail(`O4 edge-on view shows no Doppler asymmetry (left/right ${edgeOn})`);

fs.writeFileSync(path.join(OUT, "metrics.json"), JSON.stringify(metrics, null, 1));
await browser.close();
console.log(JSON.stringify({ closure: metrics.closure, poleSteps: metrics.poleSteps, doppler: metrics.doppler }));
if (failures.length) {
  console.log(`FAIL (${failures.length})\n` + failures.join("\n"));
  process.exit(1);
}
console.log("PASS");
