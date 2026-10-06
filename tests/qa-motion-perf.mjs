#!/usr/bin/env node
// Frame pacing of the sitewide motion (production build): route transitions and wheel-scrolling every page.
// Usage: node tests/qa-motion-perf.mjs [baseUrl=http://localhost:3210] [outName=perf] [w=1440] [h=900]
// Records requestAnimationFrame intervals, long tasks and where slow frames happen (route, scroll offset, phase).
// Observations on this machine only — not a claim about other devices.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const [base = "http://localhost:3210", name = "perf", w = "1440", h = "900"] = process.argv.slice(2);
const OUT = path.join(ROOT, "docs/research/sitewide-motion", name);
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
// REDUCED=1: control run with prefers-reduced-motion (no transitions, no reveals) on the same build and machine
const REDUCED = !!process.env.REDUCED;
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, reducedMotion: REDUCED ? "reduce" : "no-preference" });
const page = await ctx.newPage();

async function startProbe(label) {
  await page.evaluate((label) => {
    const gen = (window.__pg = (window.__pg || 0) + 1);
    window.__probe = { label, iv: [], slow: [], lt: [] };
    let last = performance.now();
    const tick = (t) => {
      if (window.__pg !== gen) return;
      const d = t - last;
      last = t;
      window.__probe.iv.push(d);
      if (d > 33.4) window.__probe.slow.push({ ms: Math.round(d), path: location.pathname, y: Math.round(scrollY), content: +(+getComputedStyle(document.getElementById("content")).opacity).toFixed(2) });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    try {
      window.__po?.disconnect();
      window.__po = new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__probe.lt.push(Math.round(e.duration))));
      window.__po.observe({ type: "longtask" });
    } catch {
      /* no long-task API */
    }
  }, label);
}
async function stopProbe() {
  const p = await page.evaluate(() => {
    window.__pg++;
    return window.__probe;
  });
  const iv = p.iv.slice(2).sort((a, b) => a - b);
  const q = (x) => +(iv[Math.min(iv.length - 1, Math.floor(x * iv.length))] ?? 0).toFixed(1);
  return {
    label: p.label,
    frames: iv.length,
    p50: q(0.5),
    p95: q(0.95),
    p99: q(0.99),
    max: +(iv[iv.length - 1] ?? 0).toFixed(1),
    over20: iv.filter((x) => x > 20).length,
    over33: iv.filter((x) => x > 33.4).length,
    longTasks: p.lt.length,
    longTaskMax: p.lt.length ? Math.max(...p.lt) : 0,
    slow: p.slow.slice(0, 8),
  };
}

const results = { transitions: [], scroll: [] };

// ---------------------------------------------------------------------------------------------------- transitions
await page.goto(`${base}/`, { waitUntil: "load" });
await page.waitForTimeout(3000);
const chain = [
  ["/projects", 'header nav a[href="/projects"]'],
  ["/about", 'header nav a[href="/about"]'],
  ["/contact", 'header nav a[href="/contact"]'],
  ["/privacy-policy", 'header nav a[href="/projects"]'],
  ["/", 'header a[aria-label="NOIR — home"]'],
  ["/about", 'header nav a[href="/about"]'],
];
for (let round = 0; round < 2; round++) {
  for (const [, sel] of chain) {
    const from = await page.evaluate(() => location.pathname);
    const href = await page.locator(sel).first().getAttribute("href");
    if (href === from) continue;
    await startProbe(`${from} → ${href} (round ${round + 1})`);
    await page.click(sel);
    await page.waitForURL((u) => new URL(u).pathname === href, { timeout: 15000 });
    await page.waitForTimeout(2600);
    results.transitions.push(await stopProbe());
  }
}

// ------------------------------------------------------------------------------------------------- page scrolling
await page.mouse.move(+w / 2, +h / 2);
for (const route of ["/", "/projects", "/about", "/contact", "/privacy-policy"]) {
  await page.goto(`${base}${route}`, { waitUntil: "load" });
  await page.waitForTimeout(3000);
  const H = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (const [dir, label] of [[1, "down"], [-1, "up"]]) {
    await startProbe(`${route} wheel ${label}`);
    const steps = Math.ceil(H / 100);
    for (let i = 0; i < steps; i++) {
      await page.mouse.wheel(0, dir * 100);
      await page.waitForTimeout(16);
    }
    await page.waitForTimeout(600);
    results.scroll.push(await stopProbe());
  }
}

const gpu = await page.evaluate(() => {
  const gl = document.createElement("canvas").getContext("webgl2");
  const ext = gl?.getExtension("WEBGL_debug_renderer_info");
  return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;
});
const out = { date: new Date().toISOString(), url: base, browser: browser.version(), gpu, cpu: os.cpus()[0]?.model, viewport: `${w}x${h}`, ...results };
fs.writeFileSync(path.join(OUT, `perf-${w}x${h}${REDUCED ? "-reduced-control" : ""}.json`), JSON.stringify({ ...out, reducedMotionControl: REDUCED }, null, 1));
const row = (r) => `${r.label.padEnd(40)} p50 ${String(r.p50).padStart(5)} p95 ${String(r.p95).padStart(5)} p99 ${String(r.p99).padStart(5)} max ${String(r.max).padStart(6)}  >33 ${r.over33}  LT ${r.longTasks}/${r.longTaskMax}ms ${r.slow.length ? JSON.stringify(r.slow.slice(0, 3)) : ""}`;
console.log(`${out.viewport} ${out.browser} ${out.gpu}`);
console.log(results.transitions.map(row).join("\n"));
console.log(results.scroll.map(row).join("\n"));
await browser.close();
