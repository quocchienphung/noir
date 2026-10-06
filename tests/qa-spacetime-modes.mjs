#!/usr/bin/env node
// Evidence screenshots of the spacetime section in its alternate modes (reduced motion, no WebGL2 at desktop
// and phone width, phone, browser zoom 200%). Usage: node tests/qa-spacetime-modes.mjs [baseUrl=http://127.0.0.1:3210]
import { chromium } from "playwright";
const base = process.argv[2] || "http://127.0.0.1:3210", OUT = "docs/research/noir/spacetime-qa/modes";
import fs from "node:fs"; fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const SEC = 'section[aria-labelledby="noir-capabilities-title"]';
async function shot(name, opts, init, p = 0.62) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "load" });
  await page.evaluate(([SEC, p]) => { const t = document.querySelector(SEC); const r = t.getBoundingClientRect(); window.scrollTo(0, scrollY + r.top + p * Math.max(0, r.height - innerHeight) + (r.height <= innerHeight * 1.5 ? 0 : 0)); }, [SEC, p]);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  await ctx.close();
}
const noGL = () => { const o = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...r) { return t === "webgl2" || t === "webgl" ? null : o.call(this, t, ...r); }; };
await shot("reduced-motion-1440x900", { reducedMotion: "reduce" }, null, 0.3);
await shot("no-webgl-1440x900", {}, noGL);
await shot("no-webgl-390x844", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, noGL, 0.4);
await shot("phone-390x844-p0.5", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, null, 0.5);
await shot("zoom200-720x450@2", { viewport: { width: 720, height: 450 }, deviceScaleFactor: 2 }, null, 0.5);
await browser.close();
