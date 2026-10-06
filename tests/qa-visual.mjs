#!/usr/bin/env node
// Visual keyframe capture for NOIR: intro and cinematic frame at 0/25/50/75/100 % at every QA viewport,
// plus the inner routes, written to docs/design-references/noir/qa/ for side-by-side review against the
// reference captures in docs/design-references/noir/{eventide,gargantua-video,bug}/.
// Usage: node tests/qa-visual.mjs [baseUrl=http://localhost:3200]
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
// NOIR_QA_OUT (repo-relative) redirects captures, so a regression run never overwrites accepted evidence
const OUT = process.env.NOIR_QA_OUT ? path.join(ROOT, process.env.NOIR_QA_OUT, "visual") : path.join(ROOT, "docs/design-references/noir/qa");
const base = process.argv[2] || "http://localhost:3200";
const viewports = [
  [1440, 900],
  [1280, 800],
  [768, 1024],
  [390, 844],
  [320, 640],
];
const keys = [0, 0.25, 0.5, 0.75, 1];
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist"] });
let shots = 0;
for (const [w, h] of viewports) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "load" });
  await page.waitForTimeout(1500);
  for (const [name, index] of [
    ["intro", 0],
    ["cinematic", 2],
  ]) {
    for (const k of keys) {
      const y = await page.evaluate(
        ([i, k]) => {
          const t = document.querySelectorAll("main > section")[i];
          const r = t.getBoundingClientRect();
          return r.top + scrollY + k * (r.height - innerHeight);
        },
        [index, k],
      );
      await page.evaluate((y) => scrollTo(0, y), y);
      await page.waitForTimeout(1100);
      await page.screenshot({ path: path.join(OUT, `${name}-${w}x${h}-${String(k * 100).padStart(3, "0")}.jpg`), quality: 82 });
      shots++;
    }
  }
  for (const route of ["/projects", "/about", "/contact", "/privacy-policy", "/404"]) {
    await page.goto(base + route, { waitUntil: "load" });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, `page${route.replaceAll("/", "-")}-${w}x${h}.jpg`), quality: 82 });
    shots++;
  }
  await ctx.close();
}
await browser.close();
console.log(`${shots} captures written to ${path.relative(ROOT, OUT)}`);
