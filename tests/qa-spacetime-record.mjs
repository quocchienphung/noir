#!/usr/bin/env node
// Motion evidence for the Spacetime Journey (prompt/04 §2): real-time WebM recordings + frame-interval stats.
// Usage: node tests/qa-spacetime-record.mjs [baseUrl=http://localhost:3000] [outName=motion]
//   scroll-desktop   1440×900: end of intro → corridor → lattice → hold → release → cinematic → back up
//                    (wheel steps, then keyboard PageUp — not wheel-only), with per-phase frame intervals
//   scroll-mobile    390×844 touch-sized viewport, same path with scripted scrolling
//   sweep            hero environment alignment sweep (dev harness, bhEnvSweep=10): source → arc → ring → arc
// Playwright's WebM is compressed: use it for motion, not sharpness. Frame intervals are requestAnimationFrame
// deltas in the page (CPU-side cadence, not GPU time).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const base = process.argv[2] || "http://localhost:3000";
const OUT = path.join(ROOT, "docs/research/noir/spacetime-qa", process.argv[3] || "motion");
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });

const INTERVALS = () => {
  const w = (window.__iv = { marks: [], d: [] });
  let last = performance.now();
  const f = (t) => {
    w.d.push(t - last);
    last = t;
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
};
const stats = (d) => {
  const s = [...d].sort((a, b) => a - b);
  const q = (x) => +s[Math.min(s.length - 1, Math.floor(x * s.length))].toFixed(2);
  return { n: s.length, p50: q(0.5), p95: q(0.95), p99: q(0.99), max: +s[s.length - 1].toFixed(1), over50ms: s.filter((v) => v > 50).length };
};

async function scrollRun(label, vw, vh, mobile) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, recordVideo: { dir: OUT, size: { width: Math.min(vw, 1280), height: Math.round(Math.min(vw, 1280) * (vh / vw)) } }, hasTouch: mobile, isMobile: mobile });
  await ctx.addInitScript(INTERVALS);
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "load" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  const geo = await page.evaluate(() => {
    const intro = document.querySelector('section[aria-labelledby="noir-intro-title"]');
    const sec = document.querySelector('section[aria-labelledby="noir-capabilities-title"]');
    const cin = document.querySelector('section[aria-labelledby="noir-cinematic-title"]');
    const top = (e) => scrollY + e.getBoundingClientRect().top;
    return { introEnd: top(intro) + intro.offsetHeight - innerHeight, secTop: top(sec), secEnd: top(sec) + sec.offsetHeight - innerHeight, cinTop: top(cin) };
  });
  const phases = {};
  const mark = async (name) => {
    const n = await page.evaluate(() => window.__iv.d.length);
    return { name, n };
  };
  const segment = async (name, fn) => {
    const a = await mark(name);
    await fn();
    const d = await page.evaluate((from) => window.__iv.d.slice(from), a.n);
    phases[name] = stats(d.slice(2));
  };
  await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, geo.introEnd - 0.12 * (vh * 2.2)));
  await page.waitForTimeout(1500);
  const glide = async (to, ms) => {
    const from = await page.evaluate(() => scrollY);
    const steps = Math.max(10, Math.round(ms / 50));
    for (let i = 1; i <= steps; i++) {
      if (mobile) await page.evaluate((y) => window.scrollTo(0, y), from + ((to - from) * i) / steps);
      else await page.mouse.wheel(0, (to - from) / steps);
      await page.waitForTimeout(50);
    }
  };
  await segment("handoff+corridor", () => glide(geo.secTop + 0.34 * (geo.secEnd - geo.secTop), 5000));
  await segment("reveal", () => glide(geo.secTop + 0.55 * (geo.secEnd - geo.secTop), 3500));
  await segment("hold-idle", () => page.waitForTimeout(4000));
  const sceneStats = await page.evaluate(() => {
    const c = document.querySelector('section[aria-labelledby="noir-capabilities-title"] canvas');
    return { ...(c?.__spacetime?.() ?? {}), buffer: c?.dataset.buffer, css: [innerWidth, innerHeight], dpr: devicePixelRatio };
  });
  await segment("release+cinematic", () => glide(geo.cinTop + 0.6 * (geo.secEnd - geo.secTop), 6000));
  await segment("reverse", async () => {
    if (mobile) await glide(geo.introEnd - 100, 6000);
    else
      for (let i = 0; i < 14; i++) {
        await page.keyboard.press("PageUp");
        await page.waitForTimeout(420);
      }
  });
  const video = page.video();
  await ctx.close();
  const file = path.join(OUT, `${label}.webm`);
  await video.saveAs(file);
  await video.delete();
  return { video: path.relative(ROOT, file), sceneStats, phases };
}

async function sweep() {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, recordVideo: { dir: OUT, size: { width: 1280, height: 720 } } });
  const page = await ctx.newPage();
  await page.goto(`${base}/qa/black-hole?scene=dive&p=0&bhPtr=0&bhQ=high&bhScale=1&bhEnvSweep=10`, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("canvas")?.dataset.ready !== undefined, null, { timeout: 30000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(11000);
  const video = page.video();
  await ctx.close();
  const file = path.join(OUT, "env-alignment-sweep.webm");
  await video.saveAs(file);
  await video.delete();
  return path.relative(ROOT, file);
}

const result = {
  date: new Date().toISOString(),
  browser: browser.version(),
  desktop: await scrollRun("scroll-desktop-1440x900", 1440, 900, false),
  mobile: await scrollRun("scroll-mobile-390x844", 390, 844, true),
  sweep: await sweep(),
};
fs.writeFileSync(path.join(OUT, "motion.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 1));
await browser.close();
