#!/usr/bin/env node
// Scroll-timeline + route-path regression QA for NOIR (the "giant statement escapes the frame" bug class).
// Usage: node tests/qa-scroll.mjs [baseUrl=http://localhost:3200]
//
// An init script runs before any page script and checks invariants on EVERY animation frame, so transient
// states (first paint after reload, scroll restore after Back, hydration after a client navigation) are
// caught, not just settled ones:
//   I1  a visible cinematic statement line lies inside the frame's clip rect and inside the viewport,
//       and below the fixed header;
//   I2  once live, the cinematic state is within one step of the track's real position
//       (pre-enter/framed/expanding/statement/exit);
//   I3  the intro statement, when visible, is inside the viewport; faded intro CTAs are not focusable;
//   I4  no horizontal overflow.
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:3200";
const failures = [];
const notes = [];
const fail = (m) => failures.push(m);

const MONITOR = () => {
  const v = (window.__noirViolations = []);
  const marks = { framedEnd: 0.06, expandedAt: 0.42, statementEnd: 0.82 };
  const parseInset = (cp, w, h) => {
    const m = /inset\(([^)]*)\)/.exec(cp || "");
    if (!m) return [0, 0, 0, 0];
    const parts = m[1].split(" round ")[0].trim().split(/\s+/).map((t, i) => (t.endsWith("%") ? (parseFloat(t) / 100) * (i % 2 === 0 ? h : w) : parseFloat(t) || 0));
    const [t, r = t, b = t, l = r] = parts;
    return [t, r, b, l];
  };
  const stateAt = (q, before) => (before ? "pre-enter" : q < marks.framedEnd ? "framed" : q < marks.expandedAt ? "expanding" : q < marks.statementEnd ? "statement" : "exit");
  let prev = null;
  const tick = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const header = document.querySelector("header");
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    const frame = document.querySelector("[data-noir-frame]");
    const title = document.getElementById("noir-cinematic-title");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (frame && title) {
      const fr = frame.getBoundingClientRect();
      const [t, r, b, l] = parseInset(getComputedStyle(frame).clipPath, fr.width, fr.height);
      const clip = { left: fr.left + l, top: fr.top + t, right: fr.right - r, bottom: fr.bottom - b };
      for (const line of title.children) {
        const op = parseFloat(getComputedStyle(line).opacity);
        if (op < 0.05 || getComputedStyle(line).visibility === "hidden") continue;
        const lr = line.getBoundingClientRect();
        // while pinned the text must clear the header and stay on screen; once the stage scrolls with the
        // page (before pin / after release) it only has to stay inside its frame
        const pinnedNow = Math.abs(fr.top) < 1;
        const vis = pinnedNow
          ? { left: Math.max(clip.left, 0), top: Math.max(clip.top, headerBottom - 1), right: Math.min(clip.right, vw), bottom: Math.min(clip.bottom, vh) }
          : clip;
        if (lr.bottom < 0 || lr.top > vh) continue; // scrolled away with the section
        if (lr.left < vis.left - 1 || lr.right > vis.right + 1 || lr.top < vis.top - 1 || lr.bottom > vis.bottom + 1)
          v.push(`I1 y=${Math.round(scrollY)} line "${line.textContent}" [${lr.left | 0},${lr.top | 0},${lr.right | 0},${lr.bottom | 0}] outside [${vis.left | 0},${vis.top | 0},${vis.right | 0},${vis.bottom | 0}] op=${op.toFixed(2)}`);
      }
      const track = frame.closest("section");
      const stage = frame.parentElement;
      // before hydration the server HTML shows the safe default (framed, no statement); I1 covers it
      if (track && stage && !reduced && stage.hasAttribute("data-live")) {
        const tr = track.getBoundingClientRect();
        const q = Math.min(1, Math.max(0, -tr.top / (tr.height - vh)));
        const before = tr.top > 0.5;
        const got = stage.getAttribute("data-state");
        // the state may come from the previous frame and may trail by the component's max lag (0.12)
        const lo = Math.max(0, Math.min(q, prev ? prev.q : q) - 0.125);
        const hi = Math.min(1, Math.max(q, prev ? prev.q : q) + 0.125);
        const allowed = new Set();
        for (let x = lo; x <= hi + 1e-9; x += 0.005) allowed.add(stateAt(x, false));
        if (before || (prev && prev.before) || lo === 0) allowed.add("pre-enter");
        if (got && !allowed.has(got) && tr.bottom > 0 && tr.top < vh) v.push(`I2 y=${Math.round(scrollY)} state ${got}, position allows ${[...allowed].join("/")} (q=${q.toFixed(3)})`);
        prev = { q, before };
      }
    }
    const intro = document.querySelector("[data-noir-intro-statement]");
    if (intro && parseFloat(getComputedStyle(intro).opacity) > 0.05 && getComputedStyle(intro).visibility !== "hidden") {
      const ir = intro.getBoundingClientRect();
      if (ir.bottom > 0 && ir.top < vh && (ir.left < -1 || ir.right > vw + 1)) v.push(`I3 intro statement outside viewport horizontally`);
    }
    if (document.documentElement.scrollWidth > vw + 1) v.push(`I4 overflow ${document.documentElement.scrollWidth - vw}px at y=${Math.round(scrollY)}`);
    if (v.length > 50) v.length = 50;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist"] });

async function session(name, viewport, fn, opts = {}) {
  const ctx = await browser.newContext({ viewport, reducedMotion: opts.reduced ? "reduce" : "no-preference" });
  await ctx.addInitScript(MONITOR);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  try {
    await fn(page);
  } catch (e) {
    fail(`${name}: threw ${String(e).slice(0, 300)}`);
  }
  const v = await page.evaluate(() => window.__noirViolations ?? []).catch(() => []);
  v.forEach((x) => fail(`${name}: ${x}`));
  errors.forEach((x) => fail(`${name}: console ${x}`));
  notes.push(`${name}: ${v.length ? "violations" : "ok"}`);
  await ctx.close();
}

const settle = (page, ms = 900) => page.waitForTimeout(ms);
const cineY = (page, q) =>
  page.evaluate((q) => {
    const t = document.querySelector("[data-noir-frame]").closest("section");
    const r = t.getBoundingClientRect();
    return r.top + scrollY + q * (r.height - innerHeight);
  }, q);
const introY = (page, p) =>
  page.evaluate((p) => {
    const t = document.querySelector("main > section");
    const r = t.getBoundingClientRect();
    return r.top + scrollY + p * (r.height - innerHeight);
  }, p);
const state = (page) => page.evaluate(() => document.querySelector("[data-noir-frame]")?.parentElement?.getAttribute("data-state"));
async function expectState(page, name, want) {
  const got = await state(page);
  if (got !== want) fail(`${name}: settled state ${got}, expected ${want}`);
}

for (const vp of [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 640 },
]) {
  const W = vp.width;
  // keyframes, both directions
  await session(`keyframes@${W}`, vp, async (page) => {
    await page.goto(base + "/", { waitUntil: "load" });
    await settle(page, 1200);
    const lead = await page.evaluate(() => getComputedStyle(document.querySelector("[data-noir-intro-statement]")).opacity);
    if (parseFloat(lead) > 0.01) fail(`keyframes@${W}: intro statement visible at p=0`);
    const l1 = await page.evaluate(() => {
      const h = document.querySelector("header").getBoundingClientRect();
      const s = document.querySelector("h1 span").getBoundingClientRect();
      return { overlap: s.top < h.bottom - 1, op: getComputedStyle(document.querySelector("h1 span")).opacity };
    });
    if (l1.overlap) fail(`keyframes@${W}: intro headline under the header`);
    for (const p of [0.25, 0.5, 0.75, 1]) {
      await page.evaluate((y) => scrollTo(0, y), await introY(page, p));
      await settle(page);
    }
    const stmt = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector("[data-noir-intro-statement]")).opacity));
    if (stmt < 0.95) fail(`keyframes@${W}: intro statement not shown at p=1 (${stmt})`);
    const ctaFocusable = await page.evaluate(() => getComputedStyle(document.querySelector("main > section a")).visibility !== "hidden");
    if (ctaFocusable) fail(`keyframes@${W}: faded intro CTA still focusable at p=1`);
    const want = { 0: "framed", 0.25: "expanding", 0.5: "statement", 0.75: "statement", 1: "exit" };
    for (const q of [0, 0.25, 0.5, 0.75, 1, 0.75, 0.5, 0.25, 0]) {
      await page.evaluate((y) => scrollTo(0, y), await cineY(page, q));
      await settle(page);
      await expectState(page, `keyframes@${W} q=${q}`, want[q]);
    }
  });
}

const desk = { width: 1440, height: 900 };
const phone = { width: 390, height: 844 };

await session("about→logo→home", desk, async (page) => {
  await page.goto(base + "/about", { waitUntil: "load" });
  await page.evaluate(() => scrollTo(0, 900));
  await settle(page, 400);
  await page.click('header a[aria-label="NOIR — home"]');
  await page.waitForURL(base + "/");
  await settle(page);
  if ((await page.evaluate(() => scrollY)) > 2) fail("about→logo→home: did not start at the top");
  await page.evaluate((y) => scrollTo(0, y), await cineY(page, 0.6));
  await settle(page);
  await expectState(page, "about→logo→home", "statement");
});

await session("projects→menu Home (phone)", phone, async (page) => {
  await page.goto(base + "/projects", { waitUntil: "load" });
  await page.click("header button[aria-controls='noir-menu']");
  await page.waitForTimeout(600);
  await page.click("#noir-menu a[href='/']");
  await page.waitForURL(base + "/");
  await settle(page);
  const open = await page.evaluate(() => document.getElementById("noir-menu").hasAttribute("data-open"));
  if (open) fail("projects→menu Home: drawer stayed open");
  await page.evaluate((y) => scrollTo(0, y), await cineY(page, 0.6));
  await settle(page);
  await expectState(page, "projects→menu Home", "statement");
});

await session("contact→footer Home", desk, async (page) => {
  await page.goto(base + "/contact", { waitUntil: "load" });
  await page.click("footer nav a[href='/']");
  await page.waitForURL(base + "/");
  await settle(page);
  await expectState(page, "contact→footer Home", "pre-enter");
});

await session("back/forward + reload mid-section", desk, async (page) => {
  await page.goto(base + "/", { waitUntil: "load" });
  await settle(page, 800);
  const y = await cineY(page, 0.6);
  await page.evaluate((y) => scrollTo(0, y), y);
  await settle(page);
  await page.click("header nav a[href='/about']");
  await page.waitForURL(base + "/about");
  await settle(page, 500);
  await page.goBack();
  await page.waitForURL(base + "/");
  await settle(page, 1200);
  notes.push(`back restored scrollY=${await page.evaluate(() => Math.round(scrollY))} (left at ${Math.round(y)})`);
  await page.goForward();
  await page.waitForURL(base + "/about");
  await page.goBack();
  await settle(page, 1200);
  await page.evaluate((y) => scrollTo(0, y), y);
  await settle(page);
  await page.reload({ waitUntil: "load" });
  await settle(page, 1500);
  const sy = await page.evaluate(() => scrollY);
  notes.push(`reload restored scrollY=${Math.round(sy)}`);
  if (Math.abs(sy - y) < 5) await expectState(page, "reload mid-section", "statement");
});

await session("fast wheel + back to top", desk, async (page) => {
  await page.goto(base + "/", { waitUntil: "load" });
  await settle(page, 800);
  await page.mouse.move(700, 450);
  for (let i = 0; i < 30; i++) await page.mouse.wheel(0, 900);
  await settle(page, 300);
  for (let i = 0; i < 15; i++) await page.mouse.wheel(0, -1400);
  await settle(page, 300);
  for (let i = 0; i < 60; i++) await page.mouse.wheel(0, 1500);
  await settle(page, 1200);
  await page.click("footer button");
  await page.waitForFunction(() => scrollY < 2, null, { timeout: 8000 });
  await settle(page, 1200);
  const op = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector("h1 span")).opacity));
  if (op < 0.95) fail(`back to top: intro headline not restored (opacity ${op})`);
});

await session("resize mid-statement", desk, async (page) => {
  await page.goto(base + "/", { waitUntil: "load" });
  await settle(page, 800);
  await page.evaluate((y) => scrollTo(0, y), await cineY(page, 0.65));
  await settle(page);
  for (const s of [{ width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(s);
    await settle(page, 700);
  }
});

await session("reduced motion", desk, async (page) => {
  await page.goto(base + "/", { waitUntil: "load" });
  await settle(page, 800);
  const r = await page.evaluate(() => {
    const intro = document.querySelector("[data-noir-intro-statement]");
    const lines = [...document.getElementById("noir-cinematic-title").children].map((l) => parseFloat(getComputedStyle(l).opacity));
    return { intro: parseFloat(getComputedStyle(intro).opacity), lines, introH: document.querySelector("main > section").getBoundingClientRect().height, vh: innerHeight };
  });
  if (r.intro < 0.95) fail("reduced motion: intro statement hidden");
  if (r.lines.some((o) => o < 0.95)) fail(`reduced motion: cinematic lines hidden ${r.lines}`);
  if (r.introH > r.vh * 2) fail("reduced motion: intro still a tall scroll track");
  await page.evaluate((y) => scrollTo(0, y), await page.evaluate(() => document.querySelector("[data-noir-frame]").getBoundingClientRect().top + scrollY));
  await settle(page, 500);
}, { reduced: true });

await browser.close();
console.log(notes.join("\n"));
if (failures.length) {
  console.log(`FAIL (${failures.length})\n` + failures.slice(0, 80).join("\n"));
  process.exit(1);
}
console.log("PASS");
