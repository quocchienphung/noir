#!/usr/bin/env node
// Deterministic captures for the Spacetime Journey work (prompt/04 §1). Needs `next dev` (/qa/black-hole).
// Usage: node tests/qa-spacetime-capture.mjs <outName> [baseUrl=http://localhost:3000] [extraQuery]
//   outName     folder under docs/research/noir/spacetime-qa/ (e.g. "baseline", "env-off", "env-on")
//   extraQuery  appended to every harness URL (e.g. "&bhEnv=0")
// Every frame: frozen gas time (bhT=12), no pointer, high tier, native scale (bhScale=1), no grain, 1280×720
// at DPR 1. Captures hero p 0/0.04/0.25/0.5/0.8, explore azimuth 0/90/180/270/360 at the opening
// inclination (83.5°, r 20) and cinematic q 0/0.06/0.25/0.42/0.6/0.8/0.95 at 1280×720 and 390×844. Each
// hero frame is rendered twice to measure the repeat-render tolerance on this machine. Writes PNGs and
// env.json (browser, GPU, viewport, render buffer sizes, repeat diffs).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const name = process.argv[2] || "baseline";
const base = process.argv[3] || "http://localhost:3000";
const extra = process.argv[4] || "";
const OUT = path.join(ROOT, "docs/research/noir/spacetime-qa", name);
fs.mkdirSync(OUT, { recursive: true });

const FIXED = "bhT=12&bhPtr=0&bhQ=high&bhScale=1&bhGrain=0";
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });

async function shoot(page, url) {
  await page.goto(url, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("canvas")?.dataset.ready !== undefined, null, { timeout: 30000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(900);
  const info = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    return { buffer: c?.dataset.buffer, output: c?.dataset.output, frame: c?.dataset.frame ?? null };
  });
  return { buf: await page.screenshot({ type: "png" }), info };
}

async function meanAbsDiff(a, b) {
  const A = await sharp(a).raw().toBuffer();
  const B = await sharp(b).raw().toBuffer();
  let d = 0, max = 0;
  for (let i = 0; i < A.length; i++) {
    const v = Math.abs(A[i] - B[i]);
    d += v;
    if (v > max) max = v;
  }
  return { mean: +(d / A.length).toFixed(4), max };
}

const env = { name, base, extra, date: new Date().toISOString(), frames: {} };
const desk = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const page = await desk.newPage();
await page.goto(`${base}/qa/black-hole?scene=dive&p=0&${FIXED}`, { waitUntil: "load" });
env.browser = browser.version();
env.gpu = await page.evaluate(() => {
  const gl = document.createElement("canvas").getContext("webgl2");
  const ext = gl?.getExtension("WEBGL_debug_renderer_info");
  return ext ? { vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL), renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) } : null;
});
env.userAgent = await page.evaluate(() => navigator.userAgent);

for (const p of [0, 0.04, 0.25, 0.5, 0.8]) {
  const url = `${base}/qa/black-hole?scene=dive&p=${p}&${FIXED}${extra}`;
  const a = await shoot(page, url);
  const b = await shoot(page, url);
  const tag = `hero-p${p.toFixed(2)}`;
  fs.writeFileSync(path.join(OUT, `${tag}.png`), a.buf);
  env.frames[tag] = { url, ...a.info, repeat: await meanAbsDiff(a.buf, b.buf) };
}
for (const az of [0, 90, 180, 270, 360]) {
  const url = `${base}/qa/black-hole?scene=dive&p=0&orbit=83.5,${az},20&${FIXED}${extra}`;
  const a = await shoot(page, url);
  const tag = `orbit-a${String(az).padStart(3, "0")}`;
  fs.writeFileSync(path.join(OUT, `${tag}.png`), a.buf);
  env.frames[tag] = { url, ...a.info };
}
for (const [vw, vh, label] of [
  [1280, 720, "desk"],
  [390, 844, "mob"],
]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 });
  const pg = await ctx.newPage();
  for (const q of [0, 0.06, 0.25, 0.42, 0.6, 0.8, 0.95]) {
    const url = `${base}/qa/black-hole?scene=cinematic&p=${q}&${FIXED}${extra}`;
    const a = await shoot(pg, url);
    const tag = `cine-${label}-q${q.toFixed(2)}`;
    fs.writeFileSync(path.join(OUT, `${tag}.png`), a.buf);
    env.frames[tag] = { url, ...a.info };
  }
  await ctx.close();
}
fs.writeFileSync(path.join(OUT, "env.json"), JSON.stringify(env, null, 2));
console.log(JSON.stringify({ out: path.relative(ROOT, OUT), gpu: env.gpu, browser: env.browser }, null, 2));
await browser.close();
