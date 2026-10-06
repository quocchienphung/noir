#!/usr/bin/env node
// Keyboard walkthrough of the spacetime section (prompt/04 §3.7). Usage: node tests/qa-spacetime-keyboard.mjs [baseUrl]
// Tabs forward from the last intro control through the section and into the cinematic, at the section's
// start (animation not yet revealed) and logs each stop: element, visible?, effective opacity, focus ring.
import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:3210";
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(base + "/", { waitUntil: "load" });
const SEC = 'section[aria-labelledby="noir-capabilities-title"]';
await page.evaluate((SEC) => { const t = document.querySelector(SEC); window.scrollTo(0, scrollY + t.getBoundingClientRect().top + 10); }, SEC);
await page.waitForTimeout(800);
// start just before the section in tab order
await page.evaluate((SEC) => { const s = document.querySelector(SEC); const b = document.createElement("button"); b.id = "__start"; s.before(b); b.focus(); }, SEC);
const stops = [];
let bad = 0;
for (let i = 0; i < 12; i++) {
  await page.keyboard.press("Tab");
  await page.waitForTimeout(120);
  const r = await page.evaluate((SEC) => {
    const el = document.activeElement;
    const inSec = !!el.closest(SEC);
    let o = 1;
    for (let e = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
    const cs = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return { inSec, tag: el.tagName.toLowerCase(), text: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 28), opacity: +o.toFixed(2), visible: cs.visibility !== "hidden" && rect.width > 0 && rect.bottom > 0 && rect.top < innerHeight, ring: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 };
  }, SEC);
  stops.push(r);
  if (!r.inSec) break;
  if (r.opacity < 0.99 || !r.visible || !r.ring) bad++;
}
console.table(stops);
// skip link (offered only before the hold): back at the section start, Enter moves to the hold and focuses the heading
await page.evaluate((SEC) => { const t = document.querySelector(SEC); window.scrollTo(0, scrollY + t.getBoundingClientRect().top + 10); }, SEC);
await page.waitForTimeout(800);
await page.evaluate(() => document.getElementById("__start").focus({ preventScroll: true }));
await page.keyboard.press("Tab");
const skipName = await page.evaluate(() => document.activeElement.textContent.trim());
await page.keyboard.press("Enter");
await page.waitForTimeout(800);
const after = await page.evaluate(() => ({ active: document.activeElement.id, ring: getComputedStyle(document.activeElement).outlineStyle }));
console.log(`skip "${skipName}" + Enter → focus #${after.active}`);
// pause: Space toggles aria-pressed
const pause = page.locator(`${SEC} button[aria-pressed]`);
await pause.focus();
const before = await pause.getAttribute("aria-pressed");
await page.keyboard.press("Space");
const toggled = await pause.getAttribute("aria-pressed");
console.log(`pause: Space → aria-pressed ${before} → ${toggled}`);
await browser.close();
if (bad || after.active !== "noir-capabilities-title" || skipName !== "Skip animation" || before === toggled) {
  console.log(`FAIL: ${bad} focus stops not visible/opaque/ringed; skip focus ${after.active}`);
  process.exit(1);
}
console.log("PASS");
