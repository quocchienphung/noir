#!/usr/bin/env node
// Black-hole capture matrix with metadata (before/after comparisons for docs/research/noir/BLACK_HOLE_REBUILD.md).
// Usage: node tests/qa-blackhole.mjs <baseUrl> <label> [extraQuery]
//   e.g. node tests/qa-blackhole.mjs http://localhost:3000 after "bhT=12&bhPtr=0"
// Dev servers honour the QA query (frozen simulation time, no pointer). Writes
// docs/design-references/noir/black-hole-rebuild/<label>/*.jpg + matrix.json.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const base = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] || "capture";
const extra = process.argv[4] ?? "bhT=12&bhPtr=0";
const OUT = path.join(ROOT, "docs/design-references/noir/black-hole-rebuild", label);
fs.mkdirSync(OUT, { recursive: true });

const viewports = [
  [1440, 900],
  [2560, 1440],
  [1280, 800],
  [390, 844],
];
// progress marks taken from the live timelines (SCROLL_TIMELINE.md / cinematic-timeline.ts)
const shots = [
  ["intro", 0, 0, "hero p=0"],
  ["intro", 0, 0.25, "hero p=0.25"],
  ["intro", 0, 0.5, "hero p=0.5"],
  ["intro", 0, 0.75, "hero p=0.75"],
  ["intro", 0, 0.84, "hero p=0.84 (fade starts)"],
  ["cinematic", 2, 0, "framed"],
  ["cinematic", 2, 0.24, "mid expansion"],
  ["cinematic", 2, 0.43, "fully open, before statement"],
  ["cinematic", 2, 0.47, "statement entering"],
];

const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const matrix = [];
for (const [w, h] of viewports) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && !/preload/.test(m.text()) && errors.push(m.text().slice(0, 300)));
  page.on("pageerror", (e) => errors.push("pageerror " + String(e).slice(0, 300)));
  await page.goto(`${base}/?${extra}`, { waitUntil: "load" });
  await page.waitForTimeout(2000);
  const gpu = await page.evaluate(() => {
    const c = document.createElement("canvas").getContext("webgl2");
    const d = c?.getExtension("WEBGL_debug_renderer_info");
    return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : "unknown";
  });
  for (const [name, index, p, note] of shots) {
    const y = await page.evaluate(
      ([i, p]) => {
        const t = document.querySelectorAll("main > section")[i];
        const r = t.getBoundingClientRect();
        return r.top + scrollY + p * (r.height - innerHeight);
      },
      [index, p],
    );
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(1400);
    const info = await page.evaluate((i) => {
      const wraps = [...document.querySelectorAll("[data-status]")];
      const wrap = i === 0 ? wraps[0] : wraps[1];
      const c = wrap?.querySelector("canvas");
      return { status: wrap?.getAttribute("data-status"), buffer: c ? `${c.width}x${c.height}` : null, css: c ? `${Math.round(c.getBoundingClientRect().width)}x${Math.round(c.getBoundingClientRect().height)}` : null, dpr: devicePixelRatio };
    }, index);
    const file = `${name}-${w}x${h}-${String(Math.round(p * 100)).padStart(3, "0")}.jpg`;
    await page.screenshot({ path: path.join(OUT, file), quality: 90 });
    matrix.push({ file, viewport: `${w}x${h}`, section: name, progress: p, note, query: extra, gpu, ...info });
  }
  if (errors.length) matrix.push({ viewport: `${w}x${h}`, errors });
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, "matrix.json"), JSON.stringify(matrix, null, 1));
console.log(`${matrix.filter((m) => m.file).length} captures → ${path.relative(ROOT, OUT)}`);
const errs = matrix.filter((m) => m.errors);
if (errs.length) console.log("errors:", JSON.stringify(errs, null, 1));
console.log([...new Set(matrix.filter((m) => m.file).map((m) => `${m.viewport} ${m.section} buffer=${m.buffer} css=${m.css} status=${m.status}`))].join("\n"));
