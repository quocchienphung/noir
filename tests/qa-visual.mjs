#!/usr/bin/env node
// Visual comparison: reference vs local at matched viewport, DPR 1 and scroll position.
// Usage: node tests/qa-visual.mjs [localBase=http://127.0.0.1:3200] [widths=1440,390] [routeFilter=comma list]
// For each route it pre-scrolls the whole page (so in-view effects have played), then captures viewport
// frames at y = 0, 1·vh, 2·vh … (max FRAMES) on both sites, plus interaction states on "/".
// The only elements removed are the reference's floating template promo and Framer badge (not part of the clone).
// Metric: a pixel is "different" when max(|ΔR|,|ΔG|,|ΔB|) > 48 (8-bit sRGB); ratio = different / total.
// Video frames, the ticker and the cursor follower are time-based, so their areas are expected to differ.
// Output: docs/design-references/<site>/<page-key>/compare/<w>-<state>.jpg (reference | local | diff)
//         docs/research/<site>/qa/visual-report.json (merged by route + width + state)
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const SITE = "norda-framer-website-3f1ea7cb";
const REF = "https://norda.framer.website";
const local = process.argv[2] || "http://127.0.0.1:3200";
const widths = (process.argv[3] || "1440,390").split(",").map(Number);
const filter = process.argv[4] ? process.argv[4].split(",") : null;
const FRAMES = 6;
// STATES_ONLY=1 skips scroll frames (only the interaction states on "/").
const STATES_ONLY = process.env.STATES_ONLY === "1";
const THRESHOLD = 48;

const crawl = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/research", SITE, "raw/crawl.json"), "utf8"));
const routes = crawl.filter((c) => !filter || filter.includes(c.path));
const browser = await chromium.launch({ channel: "chrome" });
const report = [];

async function prepare(base, route, w) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 }, deviceScaleFactor: 1, serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.goto(base + route, { waitUntil: "networkidle", timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: "*{caret-color:transparent!important}" });
  await hidePromo(page);
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 300) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.mouse.move(1, 1);
  await page.waitForTimeout(3200); // load-triggered titles, menu rise
  return { ctx, page };
}

// The reference's floating template promo ("New Release · Get this template · from $129") and the Framer
// badge are not part of the reconstruction; they are hidden before every capture (they mount late).
function hidePromo(page) {
  return page.evaluate(() => {
    for (const el of document.querySelectorAll("body *")) {
      if (getComputedStyle(el).position === "fixed" && /Get this template|New Release|from \$129/.test(el.textContent || "")) el.style.display = "none";
    }
    const badge = document.getElementById("__framer-badge-container");
    if (badge) badge.style.display = "none";
  });
}

async function shoot(page, y) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(1400);
  await hidePromo(page);
  return page.screenshot({ type: "png" });
}

async function compare(a, b, outFile) {
  const A = sharp(a).removeAlpha();
  const B = sharp(b).removeAlpha();
  const { data: da, info } = await A.raw().toBuffer({ resolveWithObject: true });
  const { data: db } = await B.resize(info.width, info.height).raw().toBuffer({ resolveWithObject: true });
  const diff = Buffer.alloc(da.length);
  let bad = 0;
  for (let i = 0; i < da.length; i += 3) {
    const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]));
    const g = Math.round((db[i] + db[i + 1] + db[i + 2]) / 9) + 170; // faded local as context
    if (d > THRESHOLD) {
      bad++;
      diff[i] = 230; diff[i + 1] = 20; diff[i + 2] = 20;
    } else {
      diff[i] = g; diff[i + 1] = g; diff[i + 2] = g;
    }
  }
  const { width, height } = info;
  const diffPng = await sharp(diff, { raw: { width, height, channels: 3 } }).png().toBuffer();
  const scale = width > 1000 ? 0.5 : 1;
  const tw = Math.round(width * scale);
  const th = Math.round(height * scale);
  const tiles = await Promise.all([a, b, diffPng].map((buf) => sharp(buf).resize(tw, th).png().toBuffer()));
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  await sharp({ create: { width: tw * 3 + 16, height: th, channels: 3, background: "#ff00ff" } })
    .composite(tiles.map((input, i) => ({ input, left: i * (tw + 8), top: 0 })))
    .jpeg({ quality: 72 })
    .toFile(outFile);
  return bad / (width * height);
}

async function record(key, route, w, state, refBuf, localBuf) {
  const file = path.join(ROOT, "docs/design-references", SITE, key, "compare", `${w}-${state}.jpg`);
  const ratio = await compare(refBuf, localBuf, file);
  report.push({ route, width: w, state, mismatch: +ratio.toFixed(4), image: path.relative(ROOT, file).split(path.sep).join("/") });
  process.stdout.write(`${route.padEnd(56)} ${String(w).padEnd(5)} ${state.padEnd(14)} ${(ratio * 100).toFixed(2)}%\n`);
}

// Interaction states on "/" in fresh contexts: alternate hero and testimonial slides (desktop arrows) and the
// first service step expanded (every width). Both pages are scrolled so the compared element sits at the same y.
async function alignTo(page, selector, top) {
  await page.evaluate(
    ([sel, top]) => {
      const el = document.querySelector(sel);
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - top);
    },
    [selector, top],
  );
  await page.waitForTimeout(900);
}
async function homeStates(c, w) {
  const vh = w >= 810 ? 900 : 844;
  if (w >= 1200) {
    const ref = await prepare(REF, "/", w);
    const loc = await prepare(local, "/", w);
    await ref.page.evaluate(() => window.scrollTo(0, 0));
    await loc.page.evaluate(() => window.scrollTo(0, 0));
    await ref.page.locator('button[aria-label="Next"]').first().click();
    await loc.page.locator('button[aria-label="Next project"]').click();
    await ref.page.waitForTimeout(1800);
    await loc.page.waitForTimeout(1800);
    await hidePromo(ref.page);
    await record(c.key, "/", w, "hero-slide-2", await ref.page.screenshot(), await loc.page.screenshot());
    await alignTo(ref.page, '[data-framer-name="Testimonials"]', 0);
    await alignTo(loc.page, 'section[aria-label="Testimonials"]', 0);
    await ref.page.locator('[data-framer-name="Testimonials"] button[aria-label="Next"]').click();
    await loc.page.locator('button[aria-label="Next testimonial"]').click();
    await ref.page.waitForTimeout(1800);
    await loc.page.waitForTimeout(1800);
    await hidePromo(ref.page);
    await record(c.key, "/", w, "testimonial-2", await ref.page.screenshot(), await loc.page.screenshot());
    await ref.ctx.close();
    await loc.ctx.close();
  }
  const ref = await prepare(REF, "/", w);
  const loc = await prepare(local, "/", w);
  // Reference: the first visible element titled "Discovery & Visioning" with a pointer cursor is the trigger.
  const refPoint = await ref.page.evaluate((vh) => {
    const el = [...document.querySelectorAll("[data-framer-name]")].find(
      (e) => /Discovery & Visioning/.test(e.textContent) && e.checkVisibility() && getComputedStyle(e).cursor === "pointer",
    );
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - vh * 0.3);
    return true;
  }, vh);
  await loc.page.evaluate((vh) => {
    const el = document.querySelector('li[data-cursor="dot"]');
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - vh * 0.3);
  }, vh);
  await ref.page.waitForTimeout(900);
  await loc.page.waitForTimeout(900);
  if (refPoint) {
    const box = await ref.page.evaluate(() => {
      const el = [...document.querySelectorAll("[data-framer-name]")].find(
        (e) => /Discovery & Visioning/.test(e.textContent) && e.checkVisibility() && getComputedStyle(e).cursor === "pointer",
      );
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + Math.min(40, r.height / 2) };
    });
    await ref.page.mouse.click(box.x, box.y);
  }
  await loc.page.locator('li[data-cursor="dot"] button[aria-expanded]').first().click();
  await ref.page.mouse.move(1, 1);
  await loc.page.mouse.move(1, 1);
  await ref.page.waitForTimeout(1500);
  await loc.page.waitForTimeout(1500);
  await hidePromo(ref.page);
  await record(c.key, "/", w, "service-open", await ref.page.screenshot(), await loc.page.screenshot());
  await ref.ctx.close();
  await loc.ctx.close();
}

for (const c of routes) {
  for (const w of widths) {
    const vh = w >= 810 ? 900 : 844;
    const ref = await prepare(REF, c.path, w);
    const loc = await prepare(local, c.path, w);
    const total = await loc.page.evaluate(() => document.documentElement.scrollHeight);
    const frames = STATES_ONLY ? 0 : Math.min(FRAMES, Math.ceil(total / vh));
    for (let k = 0; k < frames; k++) {
      const y = Math.min(k * vh, total - vh);
      await record(c.key, c.path, w, `y${y}`, await shoot(ref.page, y), await shoot(loc.page, y));
    }
    if (c.path === "/") {
      // Menu open.
      await ref.page.evaluate(() => window.scrollTo(0, 0));
      await loc.page.evaluate(() => window.scrollTo(0, 0));
      await ref.page.locator('header[data-framer-name="Menu Start"] a').first().click({ force: true });
      await loc.page.locator('button[aria-controls="nd-menu"]').click();
      await ref.page.waitForTimeout(1600);
      await loc.page.waitForTimeout(1600);
      await hidePromo(ref.page);
      await record(c.key, c.path, w, "menu-open", await ref.page.screenshot(), await loc.page.screenshot());
      await ref.page.keyboard.press("Escape");
      await loc.page.keyboard.press("Escape");
      await ref.page.waitForTimeout(1200);
      await loc.page.waitForTimeout(1200);
    }
    await ref.ctx.close();
    await loc.ctx.close();
    if (c.path === "/") await homeStates(c, w);
  }
}
await browser.close();

// Merge with an existing report so partial runs (route filter / STATES_ONLY) refresh only what they captured.
const out = path.join(ROOT, "docs/research", SITE, "qa/visual-report.json");
const key = (f) => `${f.route} ${f.width} ${f.state}`;
const previous = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf8")).frames ?? [] : [];
const merged = new Map(previous.map((f) => [key(f), f]));
for (const f of report) merged.set(key(f), f);
fs.writeFileSync(out, JSON.stringify({ reference: REF, local, threshold: THRESHOLD, dpr: 1, generatedAt: new Date().toISOString(), frames: [...merged.values()] }, null, 2));
const sorted = [...report].sort((a, b) => b.mismatch - a.mismatch);
console.log("\nlargest mismatches:");
for (const r of sorted.slice(0, 15)) console.log(`  ${(r.mismatch * 100).toFixed(2)}%  ${r.route} @${r.width} ${r.state}`);
