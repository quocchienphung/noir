#!/usr/bin/env node
// Captures the post-intro spacetime scene on the real home page at exact scene progress values.
// Usage: node tests/qa-spacetime-scene.mjs <outDir> [baseUrl=http://localhost:3000] [w=1440] [h=900] [p list=0,0.12,0.25,0.34,0.45,0.6,0.8,0.95] [query] [section=capabilities|cinematic]
// Scrolls so the track sits at progress p (p = −trackTop / (trackHeight − innerHeight)), waits for the
// smoothed timeline to settle, and screenshots the viewport. `stT` (dev only) freezes the ambient clock.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const [outName = "scene", base = "http://localhost:3000", w = "1440", h = "900", list = "0,0.12,0.25,0.34,0.45,0.6,0.8,0.95", query = "stT=6", section = "capabilities"] = process.argv.slice(2);
const SEL = `section[aria-labelledby="noir-${section}-title"]`;
const OUT = path.join(ROOT, "docs/research/noir/spacetime-qa", outName);
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const page = await (await browser.newContext({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1 })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(`${base}/?${query}`, { waitUntil: "load" });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
const info = [];
for (const p of list.split(",").map(Number)) {
  const y = await page.evaluate(([p, SEL]) => {
    const t = document.querySelector(SEL);
    const r = t.getBoundingClientRect();
    const top = scrollY + r.top;
    const range = Math.max(0, r.height - innerHeight);
    return Math.round(top + p * range);
  }, [p, SEL]);
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(1400);
  const state = await page.evaluate((SEL) => {
    const st = document.querySelector(`${SEL} [data-state]`);
    const c = st?.querySelector("canvas");
    return { state: st?.getAttribute("data-state"), buffer: c?.dataset.buffer, tier: c?.dataset.tier, ready: c?.dataset.ready !== undefined };
  }, SEL);
  const file = `${section}-${w}x${h}-p${p.toFixed(2)}.png`;
  await page.screenshot({ path: path.join(OUT, file) });
  info.push({ p, y, file, ...state });
}
fs.writeFileSync(path.join(OUT, `scene-${w}x${h}.json`), JSON.stringify({ info, errors }, null, 2));
console.log(JSON.stringify({ info, errors }, null, 1));
await browser.close();
