#!/usr/bin/env node
// Near-white clipping and detail in the cinematic scene (prompt/03 §F). Renderer-only captures (no text/UI)
// from the dev harness, so the ROI never contains typography.
// Usage: node tests/qa-spacetime-glare.mjs <outName> [baseUrl=http://localhost:3000] [extraQuery]
//   near-white: all three 8-bit sRGB output channels > 0.98 × 255 (= 250), after the renderer's own ACES
//   tone map and sRGB encode (the displayed image). ROI: the brightest 20 % of the frame by local mean
//   luma (64 px blocks) — the band/contact region wherever the camera puts it — plus whole-frame stats.
//   detail: RMS of (luma − 5×5 box blur) inside the ROI, a diagnostic only (noise raises it too).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const name = process.argv[2] || "glare";
const base = process.argv[3] || "http://localhost:3000";
const extra = process.argv[4] || "";
const OUT = path.join(ROOT, "docs/research/noir/spacetime-qa", name);
fs.mkdirSync(OUT, { recursive: true });
const FIXED = "bhT=12&bhPtr=0&bhQ=high&bhScale=1&bhGrain=0";
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });

async function analyse(buf) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const L = new Float32Array(W * H);
  let white = 0;
  const isWhite = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
    L[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (r > 250 && g > 250 && b > 250) {
      white++;
      isWhite[i] = 1;
    }
  }
  const B = 64;
  const blocks = [];
  for (let by = 0; by + B <= H; by += B)
    for (let bx = 0; bx + B <= W; bx += B) {
      let m = 0;
      for (let y = by; y < by + B; y++) for (let x = bx; x < bx + B; x++) m += L[y * W + x];
      blocks.push({ bx, by, m: m / (B * B) });
    }
  blocks.sort((a, b) => b.m - a.m);
  const roi = blocks.slice(0, Math.max(1, Math.round(blocks.length * 0.2)));
  let rw = 0, rn = 0, d2 = 0, lsum = 0;
  for (const { bx, by } of roi)
    for (let y = by + 2; y < by + B - 2; y++)
      for (let x = bx + 2; x < bx + B - 2; x++) {
        const i = y * W + x;
        rn++;
        rw += isWhite[i];
        lsum += L[i];
        let s = 0;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) s += L[i + dy * W + dx];
        const d = L[i] - s / 25;
        d2 += d * d;
      }
  return {
    nearWhiteFrame: +(white / (W * H)).toFixed(5),
    nearWhiteRoi: +(rw / rn).toFixed(5),
    roiMeanLuma: +(lsum / rn).toFixed(2),
    roiDetailRms: +Math.sqrt(d2 / rn).toFixed(3),
  };
}

const res = {};
for (const [vw, vh, label] of [
  [1280, 720, "desk"],
  [390, 844, "mob"],
]) {
  const page = await (await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 })).newPage();
  for (const q of [0, 0.06, 0.25, 0.42, 0.6, 0.8, 0.95]) {
    for (const view of ["", "&bhView=1"]) {
      const url = `${base}/qa/black-hole?scene=cinematic&p=${q}&${FIXED}${view}${extra}&bhDump=1`;
      await page.goto(url, { waitUntil: "load" });
      await page.waitForFunction(() => document.querySelector("canvas")?.dataset.ready !== undefined, null, { timeout: 30000 });
      await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
      await page.waitForTimeout(900);
      const buf = await page.screenshot({ type: "png" });
      const tag = `cine-${label}-q${q.toFixed(2)}${view ? "-nobloom" : ""}`;
      fs.writeFileSync(path.join(OUT, `${tag}.png`), buf);
      const frame = await page.evaluate(() => {
        const c = document.querySelector("canvas");
        const f = c?.dataset.frame ? JSON.parse(c.dataset.frame) : null;
        return f && { camPos: f.camPos, tanHalfFov: f.tanHalfFov, exposure: f.exposure, bloomGain: f.bloomGain, bloomThreshold: f.bloomThreshold, veil: f.veil, gasGain: f.gas.gain, buffer: c.dataset.buffer };
      });
      res[tag] = { ...(await analyse(buf)), frame };
    }
  }
}
fs.writeFileSync(path.join(OUT, "glare.json"), JSON.stringify(res, null, 2));
console.table(Object.fromEntries(Object.entries(res).map(([k, v]) => [k, { white: v.nearWhiteFrame, whiteRoi: v.nearWhiteRoi, roiL: v.roiMeanLuma, detail: v.roiDetailRms }])));
await browser.close();
