#!/usr/bin/env node
// 360° explore: touch, cancel, lifecycle, reduced motion and no-WebGL (MASTER PROMPT V2 §8, §13.3).
// Needs `next dev` for the orientation readout. Usage: node tests/qa-explore-lifecycle.mjs [baseUrl=http://localhost:3000]
//   T1 a vertical swipe on the hero scrolls the page and does not enter explore (no scroll hijack)
//   T2 a tap on the media enters; a one-finger drag on the surface rotates; the page does not scroll
//   T3 touchcancel mid-drag leaves no stuck drag (orientation settles and stays put)
//   L1 resize while orbiting keeps the mode and a valid frame
//   L2 a hidden tab pauses the loop; on return the scene renders again and the mode is kept
//   L3 WebGL context loss while orbiting recovers to a rendered frame, without page errors
//   R1 reduced motion: entry works, release has no inertial coast
//   W1 without WebGL the entry button is hidden and the poster stays
import { chromium } from "playwright";
import sharp from "sharp";

const base = process.argv[2] || "http://localhost:3000";
const failures = [];
const notes = [];
const fail = (m) => failures.push(m);
const args = ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"];

const ready = async (page) => {
  await page.waitForFunction(() => document.querySelector("canvas")?.dataset.ready !== undefined, null, { timeout: 60000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(800);
};
const mode = (page) => page.evaluate(() => document.querySelector("[data-explore]")?.getAttribute("data-explore") ?? "scroll");
const angles = (page) => page.evaluate(() => window.__noirExplore?.angles());
const luma = async (page) => {
  const { data } = await sharp(await page.screenshot({ type: "png" })).greyscale().raw().toBuffer({ resolveWithObject: true });
  let m = 0;
  for (const v of data) m += v;
  return m / data.length;
};

const browser = await chromium.launch({ channel: "chrome", args });

// ---- touch ---------------------------------------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto(`${base}/?bhT=12&bhPtr=0`, { waitUntil: "load" });
  await ready(page);
  const cdp = await ctx.newCDPSession(page);
  const touch = (type, pts) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map(([x, y]) => ({ x, y })) });
  const swipe = async (x, y0, y1, steps = 12, end = "touchEnd") => {
    await touch("touchStart", [[x, y0]]);
    for (let i = 1; i <= steps; i++) {
      await touch("touchMove", [[x, y0 + ((y1 - y0) * i) / steps]]);
      await page.waitForTimeout(16);
    }
    await touch(end, []);
  };
  // T1: swipe up over the media (not on text/buttons)
  const sy0 = await page.evaluate(() => scrollY);
  await swipe(195, 600, 250);
  await page.waitForTimeout(900);
  const sy1 = await page.evaluate(() => scrollY);
  if (sy1 - sy0 < 100) fail(`T1 swipe did not scroll the page (${sy0} → ${sy1})`);
  if ((await mode(page)) !== "scroll") fail(`T1 swipe entered explore (mode ${await mode(page)})`);
  notes.push(`T1 swipe scrolled ${sy0} → ${sy1}`);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(900);
  // T2: tap enters, drag rotates, page stays put
  await page.touchscreen.tap(195, 330);
  await page.waitForTimeout(700);
  if ((await mode(page)) !== "orbit") fail(`T2 tap did not enter (mode ${await mode(page)})`);
  const a0 = await angles(page);
  const ty0 = await page.evaluate(() => scrollY);
  await swipe(195, 600, 300);
  await page.waitForTimeout(600);
  const a1 = await angles(page);
  const ty1 = await page.evaluate(() => scrollY);
  if (!a0 || !a1 || Math.abs(a1.inclination - a0.inclination) < 15) fail(`T2 touch drag did not rotate (${a0?.inclination} → ${a1?.inclination})`);
  if (Math.abs(ty1 - ty0) > 2) fail(`T2 page scrolled during an orbit drag (${ty0} → ${ty1})`);
  notes.push(`T2 touch drag inclination ${a0?.inclination.toFixed(1)} → ${a1?.inclination.toFixed(1)}`);
  // T3: cancel mid-drag
  await swipe(195, 500, 400, 6, "touchCancel");
  await page.waitForTimeout(700);
  const c0 = await angles(page);
  await page.waitForTimeout(500);
  const c1 = await angles(page);
  if (Math.abs(c1.inclination - c0.inclination) > 0.05 || Math.abs(c1.azimuth - c0.azimuth) > 0.05) fail(`T3 orientation still moving after touchcancel (${JSON.stringify(c0)} → ${JSON.stringify(c1)})`);
  // a fresh drag still works after the cancel
  await swipe(195, 400, 600);
  await page.waitForTimeout(500);
  const c2 = await angles(page);
  if (Math.abs(c2.inclination - c1.inclination) < 10) fail("T3 drag after touchcancel did not rotate");
  await page.getByRole("button", { name: "Close 360° view" }).tap();
  await page.waitForTimeout(800);
  if ((await mode(page)) !== "scroll") fail("T2 Close (tap) did not exit");
  if (errors.length) fail(`touch: page errors ${errors.slice(0, 2).join(" | ")}`);
  await ctx.close();
}

// ---- lifecycle -----------------------------------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`${base}/?bhT=12&bhPtr=0`, { waitUntil: "load" });
  await ready(page);
  await page.getByRole("button", { name: "Explore 360°" }).click();
  await page.waitForTimeout(700);
  // L1 resize
  await page.setViewportSize({ width: 1100, height: 760 });
  await page.waitForTimeout(900);
  if ((await mode(page)) !== "orbit") fail(`L1 resize left orbit (mode ${await mode(page)})`);
  const out = await page.evaluate(() => document.querySelector("canvas")?.dataset.output);
  if (out !== "1100x760") fail(`L1 canvas output ${out} after resize to 1100×760`);
  if (!((await luma(page)) > 2)) fail("L1 black frame after resize");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(700);
  // L2 hidden tab
  const other = await ctx.newPage();
  await other.goto("about:blank");
  await other.bringToFront();
  await page.waitForTimeout(800);
  const hidden = await page.evaluate(() => document.visibilityState);
  await page.bringToFront();
  await page.waitForTimeout(900);
  await other.close();
  if ((await mode(page)) !== "orbit") fail(`L2 mode after a hidden tab: ${await mode(page)}`);
  if (!((await luma(page)) > 2)) fail("L2 black frame after returning to the tab");
  notes.push(`L2 visibility while away: ${hidden}`);
  if (hidden !== "hidden") {
    // the second page opened as its own window, so this one never hid: emulate the event instead
    // (the canvas loop and the explore drag listen to visibilitychange)
    const setHidden = (h) =>
      page.evaluate((h) => {
        if (h) {
          Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
          Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
        } else {
          delete document.visibilityState;
          delete document.hidden;
        }
        document.dispatchEvent(new Event("visibilitychange"));
      }, h);
    await page.mouse.move(720, 450);
    await page.mouse.down();
    await page.mouse.move(760, 450);
    await setHidden(true);
    await page.waitForTimeout(800);
    await page.mouse.up();
    await setHidden(false);
    await page.waitForTimeout(900);
    if ((await mode(page)) !== "orbit") fail(`L2 mode after an emulated hidden tab: ${await mode(page)}`);
    if (!((await luma(page)) > 2)) fail("L2 black frame after an emulated hidden tab");
    notes.push("L2 hidden tab emulated with visibilitychange");
  }
  // L3 context loss and restore while orbiting
  const lost = await page.evaluate(() => {
    const c = document.querySelector("canvas");
    const ext = c?.getContext("webgl2")?.getExtension("WEBGL_lose_context");
    if (!ext) return false;
    ext.loseContext();
    setTimeout(() => ext.restoreContext(), 600);
    return true;
  });
  if (!lost) notes.push("L3 WEBGL_lose_context unavailable: skipped");
  else {
    await page.waitForTimeout(3500);
    const l = await luma(page);
    if (!(l > 2)) fail(`L3 no frame after context restore (luma ${l.toFixed(2)})`);
    if (!["orbit", "scroll"].includes(await mode(page))) fail(`L3 mode after restore: ${await mode(page)}`);
    notes.push(`L3 after restore: mode ${await mode(page)}, luma ${l.toFixed(1)}`);
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(800);
  if (errors.length) fail(`lifecycle: page errors ${errors.slice(0, 3).join(" | ")}`);
  await ctx.close();
}

// ---- reduced motion ------------------------------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(`${base}/?bhT=12&bhPtr=0`, { waitUntil: "load" });
  await ready(page);
  const btn = page.getByRole("button", { name: "Explore 360°" });
  if (!(await btn.isVisible())) fail("R1 entry button not visible with reduced motion");
  else {
    await btn.click();
    await page.waitForTimeout(400);
    if ((await mode(page)) !== "orbit") fail(`R1 no orbit with reduced motion (mode ${await mode(page)})`);
    await page.mouse.move(720, 450);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(720 + i * 30, 450);
      await page.waitForTimeout(16);
    }
    await page.mouse.up();
    const r0 = await angles(page);
    await page.waitForTimeout(400);
    const r1 = await angles(page);
    if (Math.abs(r1.azimuth - r0.azimuth) > 0.05) fail(`R1 inertial coast with reduced motion (${r0.azimuth.toFixed(2)} → ${r1.azimuth.toFixed(2)})`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    if ((await mode(page)) !== "scroll") fail("R1 Escape did not exit with reduced motion");
  }
  await ctx.close();
}
await browser.close();

// ---- no WebGL ------------------------------------------------------------------------------------
{
  const b = await chromium.launch({ channel: "chrome", args: ["--disable-webgl", "--disable-3d-apis"] });
  const page = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(`${base}/`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const st = await page.evaluate(() => ({
    gl: !!document.createElement("canvas").getContext("webgl2"),
    btn: (() => {
      const el = [...document.querySelectorAll("button")].find((x) => /Explore 360/.test(x.textContent ?? ""));
      if (!el) return "absent";
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0 || r.width === 0 || el.inert ? "hidden" : "visible";
    })(),
    poster: [...document.querySelectorAll("main section img")].some((i) => i.complete && i.naturalWidth > 0 && getComputedStyle(i).opacity !== "0"),
  }));
  notes.push(`W1 ${JSON.stringify(st)}`);
  if (st.gl) notes.push("W1 WebGL2 still available with the flags: check inconclusive");
  else {
    if (st.btn === "visible") fail("W1 entry button visible without WebGL");
    if (!st.poster) fail("W1 no visible poster without WebGL");
  }
  await b.close();
}

console.log(notes.join("\n"));
if (failures.length) {
  console.log(`FAIL (${failures.length})\n` + failures.join("\n"));
  process.exit(1);
}
console.log("PASS");
