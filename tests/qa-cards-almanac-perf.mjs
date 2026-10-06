#!/usr/bin/env node
// Frame timing while wheel-scrolling through the Cards Almanac (use a production server).
// Usage: node tests/qa-cards-almanac-perf.mjs [baseUrl=http://localhost:3210] [w=1440] [h=900] [endOffset=0]
//   endOffset: stop this many px before Complexity's top edge reaches the viewport bottom (400 keeps the
//   protected Complexity renderer from starting inside the measurement)
// Records requestAnimationFrame intervals, long tasks and CDP layout/style/script counters during a forward and a
// backward wheel pass and a second (warm) forward pass, and writes docs/research/cards-almanac/implementation/perf-<w>x<h>.json. Reports observations
// on this machine only; it does not establish 60 fps on other devices.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const [base = "http://localhost:3210", w = "1440", h = "900", endArg = "0"] = process.argv.slice(2);
const END = Number(endArg) || 0;
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(`${base}/`, { waitUntil: "load" });
await page.waitForTimeout(1500);
const cdp = await ctx.newCDPSession(page);
await cdp.send("Performance.enable");
const range = await page.evaluate((END) => {
  const s = document.getElementById("work");
  const top = s.getBoundingClientRect().top + scrollY;
  // stop where the Complexity section reaches the viewport's bottom edge: its black hole is not this section's cost
  return { from: Math.round(top - innerHeight * 0.5), to: Math.round(top + s.offsetHeight - innerHeight - END) };
}, END);
await page.evaluate((y) => window.scrollTo(0, y), range.from);
await page.waitForTimeout(800);
await page.mouse.move(+w / 2, +h / 2);

async function pass(dir) {
  await page.evaluate(() => {
    window.__iv = [];
    window.__slow = [];
    window.__lt = [];
    let last = performance.now();
    const gen = (window.__gen = (window.__gen || 0) + 1);
    const tick = (t) => {
      if (window.__gen !== gen) return; // a previous pass's loop never revives
      window.__iv.push(t - last);
      if (t - last > 33.4) window.__slow.push({ frame: window.__iv.length - 1, ms: Math.round(t - last), sectionY: Math.round(-document.getElementById("work").getBoundingClientRect().top) });
      last = t;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    window.__po = new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(e.duration)));
    window.__po.observe({ type: "longtask", buffered: false });
  });
  const m0 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  const steps = Math.ceil((range.to - range.from) / 80);
  const t0 = Date.now();
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, dir * 80);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(400);
  const dur = (Date.now() - t0) / 1000;
  const m1 = Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));
  const r = await page.evaluate(() => {
    window.__gen++;
    window.__po.disconnect();
    return { iv: window.__iv.slice(1), lt: window.__lt, slow: window.__slow };
  });
  const iv = r.iv.sort((a, b) => a - b);
  const q = (p) => +iv[Math.min(iv.length - 1, Math.floor(p * iv.length))].toFixed(2);
  return {
    direction: dir > 0 ? "forward" : "backward",
    seconds: +dur.toFixed(2),
    frames: iv.length,
    p50: q(0.5),
    p95: q(0.95),
    p99: q(0.99),
    max: +iv[iv.length - 1].toFixed(2),
    over20ms: iv.filter((x) => x > 20).length,
    over33ms: iv.filter((x) => x > 33.4).length,
    longTasks: r.lt.length,
    /** frames over 33 ms and where they happened (px the section top is above the viewport top; < 0 = below) */
    slowFrames: r.slow,
    longTaskMaxMs: r.lt.length ? Math.round(Math.max(...r.lt)) : 0,
    layouts: m1.LayoutCount - m0.LayoutCount,
    styleRecalcs: m1.RecalcStyleCount - m0.RecalcStyleCount,
    scriptMs: +((m1.ScriptDuration - m0.ScriptDuration) * 1000).toFixed(1),
    layoutMs: +((m1.LayoutDuration - m0.LayoutDuration) * 1000).toFixed(1),
  };
}
const forward = await pass(1);
const backward = await pass(-1);
// a second forward pass separates one-time work (lazy cover decode, the next section's renderer prewarm) from
// the steady per-frame cost
const forwardWarm = await pass(1);
const gpu = await page.evaluate(() => {
  const gl = document.createElement("canvas").getContext("webgl2");
  const ext = gl?.getExtension("WEBGL_debug_renderer_info");
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;
});
const out = {
  date: new Date().toISOString(),
  url: base,
  browser: browser.version(),
  gpu,
  cpu: os.cpus()[0]?.model,
  viewport: `${w}x${h}`,
  endOffset: END,
  dpr: 1,
  wheel: "80 px per step, one step per ~16 ms, from half a viewport above the section to where Complexity enters, and back",
  forward,
  backward,
  forwardWarm,
  note: "Observed on this machine under Playwright with GPU flags; frame intervals include the browser's own scroll and compositing. Not a guarantee for other devices.",
};
const file = path.join(ROOT, `docs/research/cards-almanac/implementation/perf-${w}x${h}${END ? `-end${END}` : ""}.json`);
fs.writeFileSync(file, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
