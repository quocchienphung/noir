#!/usr/bin/env node
// Deterministic captures of the Cards Almanac states (prompt/cards-almanac/03_QA.md, visual matrix), plus
// side-by-side sheets against the public reference frames (research only; never served).
// Usage: node tests/qa-cards-almanac-capture.mjs [outName=after] [baseUrl=http://localhost:3000]
// Writes docs/research/cards-almanac/implementation/<outName>/: <state>-<w>x<h>.png and compare-*.png.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const [name = "after", base = "http://localhost:3000"] = process.argv.slice(2);
const OUT = path.join(ROOT, "docs/research/cards-almanac/implementation", name);
const REF = path.join(ROOT, "prompt/references/cards-almanac/frames");
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const SEC = "#work";

async function session(w, h, query = "") {
  const page = await (await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage();
  await page.goto(`${base}/?bhT=12&bhPtr=0${query}`, { waitUntil: "load" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(1500);
  const settleY = (i) =>
    page.evaluate(
      ([SEC, i]) => {
        const list = document.querySelector(`${SEC} ol`);
        const first = list.children[0];
        const pitch = first.offsetHeight + (list.children[1] ? parseFloat(getComputedStyle(list.children[1]).marginTop) : 0);
        return Math.round(list.getBoundingClientRect().top + scrollY + i * pitch - parseFloat(getComputedStyle(list.children[i]).top) + 1);
      },
      [SEC, i],
    );
  const shot = async (state, y) => {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(400);
    await page.waitForFunction((SEC) => !document.querySelector(`${SEC} ol`)?.hasAttribute("data-moving"), SEC, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
    const file = path.join(OUT, `${state}-${w}x${h}.png`);
    await page.screenshot({ path: file });
    return file;
  };
  return { page, settleY, shot };
}

const files = {};
for (const [w, h] of [[1440, 900], [1920, 1366]]) {
  const { page, settleY, shot } = await session(w, h);
  const n = await page.evaluate((SEC) => document.querySelectorAll(`${SEC} ol > li`).length, SEC);
  const sectionTop = await page.evaluate((SEC) => Math.round(document.querySelector(SEC).getBoundingClientRect().top + scrollY), SEC);
  const s0 = await settleY(0), s1 = await settleY(1), sl = await settleY(n - 1);
  files[`${w}`] = {
    entry: await shot("1-intro-to-gallery", sectionTop - Math.round(h * 0.15)),
    heading: await shot("1b-heading-first-card", sectionTop + Math.round(h * 0.12)),
    first: await shot("2-first-settled", s0),
    half: await shot("3-second-halfway", Math.round(s0 + (s1 - s0) * 0.55)),
    third: await shot("4-third-settled", await settleY(Math.min(2, n - 1))),
    hold: await shot("5-last-held", sl + Math.round(h * 0.2)),
    release: await shot("6-release-to-complexity", await page.evaluate((SEC) => { const s = document.querySelector(SEC); return Math.round(s.getBoundingClientRect().bottom + scrollY - innerHeight * 0.55); }, SEC)),
  };
  if (n >= 6) {
    const s4 = await settleY(4), s5 = await settleY(5);
    files[`${w}`].sixth = await shot("4b-sixth-entering", Math.round(s4 + (s5 - s4) * 0.45));
  }
  // 7 reverse: back to the halfway state from below
  files[`${w}`].reverse = await shot("7-reverse-second-halfway", Math.round(s0 + (s1 - s0) * 0.55));
  if (w === 1440) {
    // 8 details: template project and empty slot
    await page.evaluate((y) => window.scrollTo(0, y), s0);
    await page.waitForTimeout(500);
    await page.click("#card-event-horizon-renderer button[aria-haspopup]");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, `8-details-template-${w}x${h}.png`) });
    await page.keyboard.press("Escape");
    await page.evaluate((y) => window.scrollTo(0, y), sl);
    await page.waitForTimeout(500);
    // keyboard path: focusing a covered card's control brings it to the front
    await page.focus("#card-open-slot button[aria-haspopup]");
    await page.waitForTimeout(900);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, `8-details-empty-${w}x${h}.png`) });
    await page.keyboard.press("Escape");
  }
  await page.context().close();
}

// six-card dev fixture (stack scalability) and the fixture live slot, when the dev server provides them
const dev = (await fetch(`${base}/qa/embed-fixture`).catch(() => null))?.status === 200;
if (dev) {
  const { page, settleY, shot } = await session(1920, 1366, "&almanacFixture=6");
  await page.waitForFunction((SEC) => document.querySelectorAll(`${SEC} ol > li`).length === 6, SEC);
  const s4 = await settleY(4), s5 = await settleY(5);
  files.fixtureEntry = await shot("fixture6-sixth-entering", Math.round(s4 + (s5 - s4) * 0.45));
  files.fixtureHeld = await shot("fixture6-held", s5 + 200);
  // the open slot is a covered card here: activate it from the keyboard path (focus brings it to the front)
  await page.focus("#card-open-slot button[aria-haspopup]");
  await page.waitForTimeout(500);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  await page.click("dialog[open] [data-slot='landing'] button");
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUT, "8-details-live-fixture-1920x1366.png") });
  await page.context().close();
}

// side-by-side against the reference (same 1920×1366 aspect; artwork differs, compare composition)
async function pair(refFrame, ours, out) {
  if (!ours) return;
  const W = 960, H = 683;
  const a = await sharp(path.join(REF, refFrame)).resize(W, H).toBuffer();
  const b = await sharp(ours).resize(W, H).toBuffer();
  await sharp({ create: { width: W * 2 + 16, height: H, channels: 3, background: "#202020" } })
    .composite([{ input: a, left: 0, top: 0 }, { input: b, left: W + 16, top: 0 }])
    .png()
    .toFile(path.join(OUT, out));
}
const big = files["1920"];
await pair("t-00.00.png", big.heading, "compare-t0.00-heading.png");
await pair("t-00.60.png", big.half, "compare-t0.60-second-entering.png");
await pair("t-01.40.png", big.third, "compare-t1.40-third-settled.png");
await pair("t-02.80.png", big.sixth ?? files.fixtureEntry, "compare-t2.80-sixth-entering.png");
await browser.close();
console.log(`captures in ${path.relative(ROOT, OUT)}`);
