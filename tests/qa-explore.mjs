#!/usr/bin/env node
// 360° explore QA on the real hero (needs `next dev` for the orientation readout).
// Usage: node tests/qa-explore.mjs [baseUrl=http://localhost:3000] [W=1440] [H=900]
// Checks: entry by button and by click/drag on the media; many horizontal turns; vertical drag over both
// poles (inclination reaches < 15° and > 165°) without NaN/flip/black frames; Reset returns the start pose;
// Escape, Close and wheel return to the scroll camera; the page keeps scrolling; CTAs still click;
// controls are not inside aria-hidden; focus returns to the entry button.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const base = process.argv[2] || "http://localhost:3000";
const W = +(process.argv[3] || 1440);
const H = +(process.argv[4] || 900);
// NOIR_QA_OUT (repo-relative) redirects captures, so a regression run never overwrites accepted evidence
const OUT = process.env.NOIR_QA_OUT ? path.join(ROOT, process.env.NOIR_QA_OUT, "explore") : path.join(ROOT, "docs/design-references/noir/black-hole-v2/explore");
fs.mkdirSync(OUT, { recursive: true });
const failures = [];
const notes = [];
const fail = (m) => failures.push(m);

const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(`${base}/?bhT=12&bhPtr=0`, { waitUntil: "load" });
await page.waitForFunction(() => document.querySelector("canvas")?.dataset.ready !== undefined, null, { timeout: 60000 });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await page.waitForTimeout(800);

const mode = () => page.evaluate(() => document.querySelector("[data-explore]")?.getAttribute("data-explore") ?? "scroll");
const angles = () => page.evaluate(() => window.__noirExplore?.angles());
const shot = async (name) => {
  const buf = await page.screenshot({ type: "png" });
  fs.writeFileSync(path.join(OUT, `${name}.png`), buf);
  const { data } = await sharp(buf).greyscale().raw().toBuffer({ resolveWithObject: true });
  let m = 0;
  for (const v of data) m += v;
  return m / data.length;
};

// controls must not live inside aria-hidden
const hiddenControls = await page.evaluate(() => [...document.querySelectorAll("main section button")].filter((b) => b.closest("[aria-hidden='true']")).length);
if (hiddenControls) fail(`${hiddenControls} explore control(s) inside aria-hidden`);

const btn = page.getByRole("button", { name: "Explore 360°" });
if (!(await btn.isVisible())) fail("entry button not visible at the hero opening");
const lumScroll = await shot("00-scroll");
await btn.click();
await page.waitForTimeout(600);
if ((await mode()) !== "orbit") fail(`after button: mode ${await mode()}`);
const a0 = await angles();
await shot("01-orbit-start");
notes.push(`start angles ${JSON.stringify(a0)}`);

// horizontal: three full turns in steps, checking every frame grab is valid
const cx = W * 0.5, cy = H * 0.5;
const dragBy = async (dx, dy, steps = 24, track = null) => {
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(cx + (dx * i) / steps, cy + (dy * i) / steps);
    await page.waitForTimeout(16);
    if (track) track.push((await angles()).inclination);
  }
  await page.mouse.up();
};
// one full turn ≈ 2π / (1.15π / H) = 1.74 H px of drag
const turn = (2 / 1.15) * H;
for (let k = 0; k < 6; k++) {
  await dragBy(turn / 2, 0);
  await page.waitForTimeout(300);
  const l = await shot(`02-yaw-${(k + 1) * 180}`);
  if (!(l > 2)) fail(`black frame after ${(k + 1) * 180}° yaw`);
}
const a1 = await angles();
notes.push(`after 3 turns ${JSON.stringify(a1)}`);
if (!a1 || !Number.isFinite(a1.inclination)) fail("NaN orientation after turns");

// vertical: go over the top pole, continue under the disk, and back up through the bottom pole
const seen = [];
const track = [];
for (let k = 0; k < 8; k++) {
  await dragBy(0, turn / 8, 12, track);
  await page.waitForTimeout(250);
  const a = await angles();
  seen.push(Math.round(a.inclination));
  const l = await shot(`03-pitch-${k}`);
  if (!(l > 1.5) || !Number.isFinite(a.inclination)) fail(`invalid frame at pitch step ${k} (luma ${l.toFixed(2)}, inc ${a.inclination})`);
}
// sampled on every move: the poles are passed between the coarse per-step readings
notes.push(`inclinations through a vertical turn: ${seen.join(", ")} (range over every move ${Math.round(Math.min(...track))}–${Math.round(Math.max(...track))}°)`);
if (Math.min(...track) > 15) fail(`never reached the top pole (min inclination ${Math.min(...track).toFixed(1)}°)`);
if (Math.max(...track) < 165) fail(`never reached the underside (max inclination ${Math.max(...track).toFixed(1)}°)`);
for (let k = 1; k < track.length; k++)
  if (Math.abs(track[k] - track[k - 1]) > 25) fail(`inclination jumped ${track[k - 1].toFixed(1)}° → ${track[k].toFixed(1)}° between two moves`);

// Reset
await page.getByRole("button", { name: "Reset view" }).click();
await page.waitForTimeout(800);
const ar = await angles();
if (Math.abs(ar.inclination - a0.inclination) > 1 || Math.min(Math.abs(ar.azimuth - a0.azimuth), 360 - Math.abs(ar.azimuth - a0.azimuth)) > 1)
  fail(`Reset did not return to the start pose: ${JSON.stringify(ar)} vs ${JSON.stringify(a0)}`);
await shot("04-after-reset");

// Escape returns, focus goes back to the entry button
await page.keyboard.press("Escape");
await page.waitForTimeout(700);
if ((await mode()) !== "scroll") fail(`after Escape: mode ${await mode()}`);
const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
if (!/Explore 360/.test(focused ?? "")) fail(`focus after exit on "${focused}"`);
const lumBack = await shot("05-after-escape");
if (Math.abs(lumBack - lumScroll) > Math.max(1.5, lumScroll * 0.08)) fail(`scroll pose not restored (luma ${lumScroll.toFixed(1)} → ${lumBack.toFixed(1)})`);

// keyboard path: Enter on the button, arrows rotate, Close button
await btn.focus();
await page.keyboard.press("Enter");
await page.waitForTimeout(600);
const ak0 = await angles();
for (let i = 0; i < 6; i++) await page.keyboard.press("ArrowUp");
await page.waitForTimeout(150);
const ak1 = await angles();
if (Math.abs(ak1.inclination - ak0.inclination) < 20) fail(`arrow keys did not rotate (${ak0.inclination} → ${ak1.inclination})`);
await page.getByRole("button", { name: "Close 360° view" }).click();
await page.waitForTimeout(700);
if ((await mode()) !== "scroll") fail("Close did not exit");

// mouse drag that starts on the media enters and rotates immediately
await page.mouse.move(W * 0.62, H * 0.42);
await page.mouse.down();
for (let i = 1; i <= 20; i++) {
  await page.mouse.move(W * 0.62 + i * 12, H * 0.42);
  await page.waitForTimeout(16);
}
await page.mouse.up();
await page.waitForTimeout(400);
if ((await mode()) !== "orbit") fail(`drag on media did not enter (mode ${await mode()})`);
await shot("06-drag-entry");

// wheel while orbiting: hands back and the page scrolls natively
const y0 = await page.evaluate(() => scrollY);
await page.mouse.wheel(0, 600);
await page.waitForTimeout(900);
const y1 = await page.evaluate(() => scrollY);
if ((await mode()) !== "scroll") fail(`wheel did not exit (mode ${await mode()})`);
if (y1 - y0 < 200) fail(`page did not scroll on wheel (${y0} → ${y1})`);
await page.evaluate(() => scrollTo(0, 0));
await page.waitForTimeout(800);

// CTA still clicks in scroll mode (no click-through / capture)
await page.getByRole("link", { name: "Start a project" }).first().click();
await page.waitForURL(/\/contact$/, { timeout: 10000 }).catch(() => fail("CTA click did not navigate"));

if (errors.length) fail(`console: ${errors.slice(0, 3).join(" | ")}`);
await browser.close();
console.log(notes.join("\n"));
if (failures.length) {
  console.log(`FAIL (${failures.length})\n` + failures.join("\n"));
  process.exit(1);
}
console.log("PASS");
