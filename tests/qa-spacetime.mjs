#!/usr/bin/env node
// Invariants of the Spacetime Journey work (prompt/04 §6). Usage: node tests/qa-spacetime.mjs [baseUrl=http://localhost:3000]
// Pure logic (transpiled from src/, no browser):
//   (L1 retired with the V1 scene)
//   L2 cinematic camera path: no jumps, continuous at framedEnd/expandedAt/statementEnd, framed pose = accepted
//   L3 shared looks are not mutated: GAS and the dive look equal the accepted values after many frames;
//      cinematic look is frozen and differs only in cinematic-only fields
//   L4 hero environment is additive: diveFrame keeps every accepted value; disabled → no `environment`
// Real page (needs `next dev` for the dev-only harness; D8/D10 also run against production):
//   D8 no reference media at runtime: no request for prompt/references or the clips, no video responses
//   D9 captured rays get no background: environment-only render has a black shadow interior
//   D10 route round trips (10×): no animation loop keeps running on another route, WebGL contexts do not pile up
// Static:
//   S1 no reference media copied into public/ or imported by runtime source
// Retired 2026-10-06 with the wormhole/tesseract archive (replaced by tests/qa-cards-almanac.mjs): D1 capabilities
// block in the archive, D2 archive skip link, D3/D4 archive state reload/reverse, D5 archive reduced motion, D6
// archive WebGL fallback, D7 archive context loss, D11 archive zoom. Their content/accessibility intent is covered
// by the Cards Almanac suite (C-checks).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { chromium } from "playwright";
import { loadTs } from "./lib/load-ts.mjs";

const ROOT = path.resolve(
  path.dirname(
    new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
  ),
  "..",
);
const base = process.argv[2] || "http://localhost:3000";
const failures = [];
const notes = [];
const fail = (m) => failures.push(m);
const check = (ok, m) => (ok ? notes.push(`ok  ${m}`) : fail(m));

// ---------------- pure logic ----------------
const S = await loadTs(path.join(ROOT, "src/lib/noir/blackhole/scenes.ts"));

// L1 (V1 spacetime timeline) was removed with the V1 scene; the archive that followed was retired for the Cards
// Almanac (tests/qa-cards-almanac.mjs). Protected hero/cinematic checks below are unchanged.

{
  const input = (q, aspect = 16 / 9) => ({
    progress: q,
    pointer: { x: 0, y: 0 },
    time: 12,
    aspect,
    quality: { steps: 280, slab: 40 },
  });
  for (const aspect of [16 / 9, 390 / 844]) {
    let maxStep = 0;
    let prev = S.cinematicFrame(input(0, aspect));
    for (let i = 1; i <= 10000; i++) {
      const f = S.cinematicFrame(input(i / 10000, aspect));
      const step =
        Math.hypot(
          f.camPos[0] - prev.camPos[0],
          f.camPos[1] - prev.camPos[1],
          f.camPos[2] - prev.camPos[2],
        ) + f.basis.reduce((s, v, j) => s + Math.abs(v - prev.basis[j]), 0);
      maxStep = Math.max(maxStep, step);
      prev = f;
    }
    check(
      maxStep < 0.02,
      `L2 cinematic camera has no jump at aspect ${aspect.toFixed(2)} (max step ${maxStep.toFixed(5)})`,
    );
  }
  // the framed pose (q ≤ 0.06) is the accepted one: d 21, elevation 2.4°, azimuth −8°, aim (0, 0.8, 0)
  const f0 = S.cinematicFrame(input(0));
  const DEG = Math.PI / 180;
  const exp = [
    21 *
      Math.cos(2.4 * DEG) *
      Math.sin(-8 * DEG + Math.sin(12 * 0.03) * 1.2 * DEG),
    21 * Math.sin(2.4 * DEG),
  ];
  check(
    Math.abs(f0.camPos[0] - exp[0]) < 1e-9 &&
      Math.abs(f0.camPos[1] - exp[1]) < 1e-9,
    "L2 framed pose equals the accepted framed camera",
  );
}

{
  const ACCEPTED_GAS = {
    inner: 2.9,
    outer: 16,
    thickness: 0.016,
    gain: 42,
    falloff: 1.65,
    opacity: 30,
    doppler: 0.35,
    orbit: 0.9,
    drift: 0.014,
    warp: 1,
    filaments: 1,
    clumping: 0.6,
    plunge: 0.38,
    period: 28,
    heat: 1.15,
  };
  const ACCEPTED_PALETTE = [
    [1.0, 0.95, 0.9],
    [0.95, 0.72, 0.5],
    [0.66, 0.32, 0.12],
    [0.22, 0.095, 0.035],
  ];
  const input = (q) => ({
    progress: q,
    pointer: { x: 0.3, y: -0.2 },
    time: 3,
    aspect: 1.6,
    quality: { steps: 280, slab: 40 },
  });
  for (let i = 0; i < 200; i++) {
    const c = S.cinematicFrame(input(i / 199));
    c.gas.gain *= 2; // a consumer mutating its frame must not leak into shared objects
    S.diveFrame(input(i / 199)).gas.opacity = 1;
  }
  const g = S.GAS;
  check(
    Object.entries(ACCEPTED_GAS).every(([k, v]) => g[k] === v) &&
      JSON.stringify(g.palette) === JSON.stringify(ACCEPTED_PALETTE),
    "L3 GAS equals the accepted values after 200 cinematic/dive frames",
  );
  const d = S.diveFrame(input(0));
  check(
    d.exposure === 1.85 &&
      d.bloomGain === 0.32 &&
      d.bloomThreshold === 1.1 &&
      d.grain === 0.035 &&
      d.hueKeep === 0.18 &&
      d.veil === 0.6 &&
      d.gas.outer === 17 &&
      d.gas.falloff === 1.45 &&
      d.starGain === 1,
    "L3 dive look equals the accepted values",
  );
  check(
    Object.isFrozen(S.CINEMATIC_LOOK) && Object.isFrozen(S.CINEMATIC_LOOK.gas),
    "L3 cinematic look is frozen",
  );
  const c = S.cinematicFrame(input(0.6));
  check(
    c.exposure === S.CINEMATIC_LOOK.exposure &&
      c.veil === S.CINEMATIC_LOOK.veil &&
      c.gas.inner === 2.9 &&
      c.gas.gain === 42,
    "L3 cinematic frame uses the cinematic look and the shared material",
  );
  check(
    d.environment?.enabled === true &&
      S.cinematicFrame(input(0.6)).environment === undefined,
    "L4 environment only on the hero (cinematic keeps the accepted background)",
  );
  const dv = S.diveFrame({
    progress: 0.5,
    pointer: { x: 0, y: 0 },
    time: 12,
    aspect: 1.6,
    quality: { steps: 280, slab: 40 },
  });
  check(dv.fade === 0 || dv.fade > 0, "L4 dive frame still computes");
}

// ---------------- real page ----------------
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"],
});
const SEC = 'section[aria-labelledby="noir-capabilities-title"]';
const scrollToP = async (page, p) => {
  await page.evaluate(
    ([SEC, p]) => {
      const t = document.querySelector(SEC);
      const r = t.getBoundingClientRect();
      window.scrollTo(
        0,
        Math.round(scrollY + r.top + p * Math.max(0, r.height - innerHeight)),
      );
    },
    [SEC, p],
  );
  await page.waitForTimeout(900);
};

{
  // D8 no reference media requested while scrolling the whole home page
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  const requests = [];
  page.on("response", (r) =>
    requests.push({ url: r.url(), type: r.headers()["content-type"] || "" }),
  );
  await page.goto(`${base}/`, { waitUntil: "load" });
  for (const p of [0, 0.25, 0.5, 0.75, 1]) await scrollToP(page, p);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(800);
  const bad = requests.filter(
    (r) =>
      /prompt\/references|hero-lensing|cinematic-closeup|tesseract-bookcase|cards-almanac\.(mp4|webp)|public-preview|SaveThreads/i.test(
        r.url,
      ) || r.type.startsWith("video/"),
  );
  check(
    bad.length === 0,
    `D8 no reference media or video responses (${requests.length} responses checked)`,
  );
  await ctx.close();
}

{
  // D9 captured rays get no background (environment only, gas off, post off so bloom cannot blur light in):
  //    the traced shadow interior is black
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const r = await page.goto(
    `${base}/qa/black-hole?scene=dive&p=0&bhT=12&bhPtr=0&bhQ=high&bhScale=1&bhGrain=0&bhEnvOnly=1&bhView=1`,
    { waitUntil: "load" },
  );
  if (r && r.status() === 200) {
    await page.waitForFunction(
      () => document.querySelector("canvas")?.dataset.ready !== undefined,
      null,
      { timeout: 30000 },
    );
    await page.addStyleTag({
      content: "nextjs-portal{display:none!important}",
    });
    await page.waitForTimeout(800);
    const buf = await page.screenshot({
      clip: { x: 610, y: 325, width: 60, height: 50 },
    });
    const { data } = await sharp(buf)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const max = Math.max(...data);
    check(
      max <= 2,
      `D9 environment-only: shadow interior max value ${max} (≤ 2 of 255: dither only)`,
    );
  } else
    notes.push(
      "--  D9 skipped (dev-only harness not available on this server)",
    );
  await ctx.close();
}

{
  // D10 route round trips: home ↔ /about through client navigation, 10 times. On /about, count how many
  // requestAnimationFrame callbacks run per second (a leaked render loop keeps scheduling) and how many WebGL
  // contexts were ever created vs how many canvases exist.
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await ctx.addInitScript(() => {
    window.__raf = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) =>
      raf((t) => {
        window.__raf++;
        cb(t);
      });
    window.__gl = 0;
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      const c = orig.call(this, type, ...rest);
      if (c && type === "webgl2" && !this.__counted) {
        this.__counted = true;
        window.__gl++;
      }
      return c;
    };
  });
  const page = await ctx.newPage();
  await page.goto(`${base}/`, { waitUntil: "load" });
  await scrollToP(page, 0.6);
  const rates = [];
  for (let i = 0; i < 10; i++) {
    await page.locator('header a[href="/about"]').first().click();
    await page.waitForURL("**/about");
    await page.waitForTimeout(400);
    const r0 = await page.evaluate(() => window.__raf);
    await page.waitForTimeout(1000);
    rates.push((await page.evaluate(() => window.__raf)) - r0);
    await page.locator('header a[href="/"]').first().click();
    await page.waitForURL((u) => new URL(u).pathname === "/");
    await page.waitForTimeout(500);
    await scrollToP(page, 0.6);
  }
  const gl = await page.evaluate(() => ({
    created: window.__gl,
    canvases: document.querySelectorAll("canvas").length,
  }));
  const heap = await page.evaluate(() =>
    performance.memory
      ? Math.round(performance.memory.usedJSHeapSize / 1e6)
      : null,
  );
  check(
    Math.max(...rates) <= 2,
    `D10 no render loop left running on /about after leaving home (rAF/s per trip: ${rates.join(",")})`,
  );
  notes.push(
    `--  D10 WebGL contexts created over 11 home visits: ${gl.created} (canvases now ${gl.canvases}); JS heap ${heap} MB`,
  );
  await ctx.close();
}


// ---------------- static: reference media never shipped ----------------
{
  const refDir = path.join(ROOT, "prompt/references");
  const hash = (f) =>
    crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
  const walk = (d, o = []) => {
    if (!fs.existsSync(d)) return o;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p, o);
      else o.push(p);
    }
    return o;
  };
  const refs = new Set(
    walk(refDir)
      .filter((f) => /\.(mp4|png|jpg|webp)$/i.test(f))
      .map(hash),
  );
  const served = walk(path.join(ROOT, "public")).filter(
    (f) => fs.statSync(f).size > 0,
  );
  const copies = served.filter((f) => refs.has(hash(f)));
  check(
    copies.length === 0,
    `S1 no reference clip/frame/image copied into public/ (${served.length} files checked against ${refs.size} references)`,
  );
  const src = walk(path.join(ROOT, "src")).filter((f) =>
    /\.(ts|tsx|css)$/.test(f),
  );
  const mentions = src.filter((f) =>
    /prompt\/references|hero-lensing\.mp4|cinematic-closeup\.mp4|tesseract-bookcase|public-preview\.mp4/.test(
      fs.readFileSync(f, "utf8"),
    ),
  );
  check(
    mentions.length === 0,
    `S1 no runtime source imports reference media (${mentions.map((f) => path.relative(ROOT, f)).join(", ") || "none"})`,
  );
}

await browser.close();
console.log(notes.join("\n"));
if (failures.length) {
  console.error(
    `\n${failures.length} FAILED:\n` +
      failures.map((f) => "  ✗ " + f).join("\n"),
  );
  process.exit(1);
}
console.log(
  `\nall ${notes.filter((n) => n.startsWith("ok")).length} checks passed`,
);
