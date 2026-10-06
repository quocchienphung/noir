#!/usr/bin/env node
// Runtime regression checks for the black-hole canvases (run against the production server).
// Usage: node tests/qa-blackhole-runtime.mjs [baseUrl=http://localhost:3200]
//  R1 both canvases go live (real WebGL2 renderer, no shader/console errors), no footage or off-origin media
//  R2 context loss → poster fallback is shown; context restore → live again (renderer rebuilt)
//  R3 reduced motion → a still, high-quality frame: two captures 1.2 s apart are identical
//  R4 WebGL unavailable → poster fallback with a loaded image, page still usable
//  R5 production bundles carry no development QA hooks (bhT / qa harness route returns 404)
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:3200";
const failures = [];
const notes = [];
const fail = (m) => failures.push(m);

async function open(opts = {}, launchArgs = []) {
  const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", ...launchArgs] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  const requests = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 300)));
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
  page.on("request", (r) => requests.push(r.url()));
  return { browser, page, errors, requests };
}
// The black-hole canvases are addressed by their section (0 intro, 1 cinematic), not by document position:
// the spacetime scene between them has its own canvas (tested by qa-spacetime.mjs).
const BH = ['section[aria-labelledby="noir-intro-title"]', 'section[aria-labelledby="noir-cinematic-title"]'];
const status = (page, i) => page.evaluate((sel) => document.querySelector(`${sel} [data-status]`)?.getAttribute("data-status"), BH[i]);
const scrollToSection = (page, sel, p) =>
  page.evaluate(
    ([sel, p]) => {
      const t = document.querySelector(sel);
      const r = t.getBoundingClientRect();
      window.scrollTo(0, r.top + scrollY + p * (r.height - innerHeight));
    },
    [sel, p],
  );

// R1 + R2
{
  const { browser, page, errors, requests } = await open();
  await page.goto(base + "/", { waitUntil: "load" });
  await page.waitForTimeout(2000);
  if ((await status(page, 0)) !== "live") fail(`R1 intro canvas status ${await status(page, 0)}`);
  await scrollToSection(page, BH[1], 0.43);
  await page.waitForTimeout(1500);
  if ((await status(page, 1)) !== "live") fail(`R1 cinematic canvas status ${await status(page, 1)}`);
  const info = await page.evaluate(() => [...document.querySelectorAll("canvas")].map((c) => ({ buffer: `${c.width}x${c.height}`, tier: c.dataset.tier })));
  notes.push(`R1 canvases ${JSON.stringify(info)}`);
  const media = requests.filter((u) => /\.(mp4|webm|m3u8|mov)(\?|$)|youtube|ytimg|googlevideo/i.test(u) || !u.startsWith(new URL(base).origin) && !u.startsWith("data:") && !u.startsWith("blob:"));
  if (media.length) fail(`R1 unexpected requests: ${media.slice(0, 5).join(", ")}`);
  if (errors.length) fail(`R1 console: ${errors.slice(0, 3).join(" | ")}`);

  // R2 context loss / restore on the cinematic canvas
  const lost = await page.evaluate((sel) => {
    const c = document.querySelector(`${sel} canvas`);
    const ext = c.getContext("webgl2")?.getExtension("WEBGL_lose_context");
    if (!ext) return false;
    window.__noirLose = ext;
    ext.loseContext();
    return true;
  }, BH[1]);
  if (!lost) notes.push("R2 skipped: WEBGL_lose_context unavailable");
  else {
    await page.waitForTimeout(1000); // the poster fades back in over 0.6 s (black-hole.module.css)
    const st = await status(page, 1);
    const poster = await page.evaluate((sel) => {
      const w = document.querySelector(`${sel} [data-status]`);
      const img = w.querySelector("img");
      return { opacity: getComputedStyle(img).opacity, loaded: img.complete && img.naturalWidth > 0 };
    }, BH[1]);
    if (st !== "fallback" || Number(poster.opacity) < 0.99 || !poster.loaded) fail(`R2 after loss: status ${st}, poster ${JSON.stringify(poster)}`);
    await page.evaluate(() => window.__noirLose.restoreContext());
    await page.waitForTimeout(1500);
    const st2 = await status(page, 1);
    if (st2 !== "live") fail(`R2 after restore: status ${st2}`);
    notes.push(`R2 loss → ${st}, restore → ${st2}`);
  }
  await browser.close();
}

// R3 reduced motion: frozen frame
{
  const { browser, page, errors } = await open({ reducedMotion: "reduce" });
  await page.goto(base + "/", { waitUntil: "load" });
  await page.waitForTimeout(2000);
  const a = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 } });
  await page.waitForTimeout(1200);
  const b = await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 } });
  if (!a.equals(b)) fail("R3 reduced motion: frame changed while idle");
  if ((await status(page, 0)) !== "live") fail(`R3 reduced motion: status ${await status(page, 0)}`);
  if (errors.length) fail(`R3 console: ${errors.slice(0, 3).join(" | ")}`);
  await browser.close();
}

// R4 WebGL unavailable
{
  const { browser, page } = await open({}, ["--disable-webgl", "--disable-webgl2"]);
  await page.goto(base + "/", { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const st = await status(page, 0);
  const poster = await page.evaluate(() => {
    const img = document.querySelector("[data-status] img");
    return { opacity: getComputedStyle(img).opacity, loaded: img.complete && img.naturalWidth > 0 };
  });
  if (st !== "fallback" || Number(poster.opacity) < 0.99 || !poster.loaded) fail(`R4 no WebGL: status ${st}, poster ${JSON.stringify(poster)}`);
  const cta = await page.evaluate(() => getComputedStyle(document.querySelector("main > section a")).visibility);
  if (cta !== "visible") fail("R4 no WebGL: intro CTA not usable");
  notes.push(`R4 no WebGL → ${st}, poster loaded ${poster.loaded}`);
  await browser.close();
}

// R5 no dev hooks in production
{
  const r = await fetch(base + "/qa/black-hole");
  if (r.status !== 404) fail(`R5 /qa/black-hole served in production (${r.status})`);
  const { browser, page } = await open();
  await page.goto(base + "/?bhT=3&bhDebug=2", { waitUntil: "load" });
  await page.waitForTimeout(1500);
  // the development GPU timer (and every bh* override) is compiled out of production bundles
  const buf = await page.evaluate(() => document.querySelector("canvas")?.dataset.gpuMs ?? null);
  if (buf !== null) fail("R5 dev GPU timer active in production");
  notes.push(`R5 qa route ${r.status}; dev query ignored (gpuMs ${buf})`);
  await browser.close();
}

console.log(notes.join("\n"));
if (failures.length) {
  console.log(`FAIL (${failures.length})\n` + failures.join("\n"));
  process.exit(1);
}
console.log("PASS");
