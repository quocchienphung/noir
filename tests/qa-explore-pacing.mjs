#!/usr/bin/env node
// Frame pacing during a 360° drag and sharpness recovery afterwards, on the real hero (MASTER PROMPT V2 §9,
// §13.4). Usage: node tests/qa-explore-pacing.mjs [baseUrl=http://localhost:3000] [W=1440] [H=900] [DPR=1]
// Records rAF intervals in the page and the canvas render scale every 250 ms through: settle (8 s) → enter →
// 8 s of continuous drag (circles, over a pole) → Reset → Close → 12 s idle. Also records a real-time
// WebM of the session (beauty: no markers) to docs/design-references/noir/black-hole-v2/motion/.
//   P1 during the drag the median frame interval ≤ max(1.25 × display interval, 17.5 ms), p95 ≤ 2.5 × that
//   P2 within 12 s of leaving, the render scale is back to ≥ 90 % of the settled value (sharpness recovers)
//   P3 no long task freezes: no single frame interval > 250 ms
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const base = process.argv[2] || "http://localhost:3000";
const W = +(process.argv[3] || 1440);
const H = +(process.argv[4] || 900);
const DPR = +(process.argv[5] || 1);
// NOIR_QA_OUT (repo-relative) redirects captures, so a regression run never overwrites accepted evidence
const OUT = process.env.NOIR_QA_OUT ? path.join(ROOT, process.env.NOIR_QA_OUT, "motion") : path.join(ROOT, "docs/design-references/noir/black-hole-v2/motion");
fs.mkdirSync(OUT, { recursive: true });
const failures = [];

const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR, recordVideo: { dir: OUT, size: { width: 1280, height: Math.round((1280 * H) / W) } } });
const page = await ctx.newPage();
await page.goto(`${base}/?bhPtr=0`, { waitUntil: "load" });
await page.waitForFunction(() => document.querySelector("canvas")?.dataset.ready !== undefined, null, { timeout: 60000 });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
// in-page recorder: frame intervals with a phase label, and the render scale every 250 ms
await page.evaluate(() => {
  const w = window;
  w.__pace = { phase: "settle", frames: [], scales: [] };
  let last = performance.now();
  const f = (t) => {
    w.__pace.frames.push([w.__pace.phase, t - last]);
    last = t;
    requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
  setInterval(() => {
    const c = document.querySelector("canvas");
    w.__pace.scales.push([w.__pace.phase, performance.now(), +(c?.dataset.scale ?? 0), c?.dataset.buffer]);
  }, 250);
});
const phase = (p) => page.evaluate((p) => (window.__pace.phase = p), p);
await page.waitForTimeout(8000);

await phase("drag");
await page.getByRole("button", { name: "Explore 360°" }).click();
await page.waitForTimeout(500);
const cx = W / 2, cy = H / 2;
await page.mouse.move(cx, cy);
await page.mouse.down();
const t0 = Date.now();
let k = 0;
while (Date.now() - t0 < 8000) {
  const a = (k / 120) * Math.PI * 2;
  // circles plus a slow vertical drift that carries the camera over the pole and under the disk
  await page.mouse.move(cx + Math.cos(a) * W * 0.18, cy + Math.sin(a) * H * 0.12 + ((k % 240) - 120) * 1.2);
  await page.waitForTimeout(16);
  k++;
}
await page.mouse.up();
await phase("leave");
await page.getByRole("button", { name: "Reset view" }).click();
await page.waitForTimeout(900);
await page.getByRole("button", { name: "Close 360° view" }).click();
await phase("after");
await page.waitForTimeout(12000);
const rec = await page.evaluate(() => window.__pace);
const video = page.video();
await ctx.close();
await browser.close();

const stats = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  return { n: s.length, median: +s[s.length >> 1].toFixed(2), p95: +s[Math.floor(s.length * 0.95)].toFixed(2), max: +s[s.length - 1].toFixed(2) };
};
const by = (p) => rec.frames.filter(([ph]) => ph === p).map(([, d]) => d).slice(2);
const vsync = [...by("settle")].sort((a, b) => a - b)[Math.floor(by("settle").length * 0.1)];
const res = { viewport: `${W}x${H}@${DPR}`, vsync: +vsync.toFixed(2), settle: stats(by("settle")), drag: stats(by("drag")), after: stats(by("after")) };
const scaleAt = (p) => rec.scales.filter(([ph]) => ph === p);
const settled = scaleAt("settle").slice(-4).map(([, , s]) => s);
const dragS = scaleAt("drag").map(([, , s]) => s);
const afterS = scaleAt("after").map(([, , s]) => s);
res.scale = { settled: Math.max(...settled), dragMin: Math.min(...dragS), dragEnd: dragS[dragS.length - 1], afterEnd: afterS[afterS.length - 1], afterMax: Math.max(...afterS) };
const rec_t = scaleAt("after").find(([, , s]) => s >= 0.9 * res.scale.settled);
res.scale.recoveredAfterMs = rec_t ? Math.round(rec_t[1] - scaleAt("after")[0][1]) : null;
const vname = `pacing-${W}x${H}@${DPR}.webm`;
if (video) {
  const vp = await video.path();
  fs.renameSync(vp, path.join(OUT, vname));
  res.video = vname;
}
fs.writeFileSync(path.join(OUT, `pacing-${W}x${H}@${DPR}.json`), JSON.stringify({ ...res, scales: rec.scales }, null, 1));
console.log(JSON.stringify(res, null, 1));

const lim = Math.max(1.25 * vsync, 17.5);
if (res.drag.median > lim) failures.push(`P1 drag median ${res.drag.median} ms > ${lim.toFixed(1)}`);
if (res.drag.p95 > 2.5 * lim) failures.push(`P1 drag p95 ${res.drag.p95} ms > ${(2.5 * lim).toFixed(1)}`);
if (!(res.scale.afterMax >= 0.9 * res.scale.settled)) failures.push(`P2 scale did not recover: settled ${res.scale.settled}, after ${res.scale.afterMax}`);
const longest = Math.max(res.settle.max, res.drag.max, res.after.max);
if (longest > 250) failures.push(`P3 a ${longest} ms frame`);
if (failures.length) {
  console.log(`FAIL (${failures.length})\n` + failures.join("\n"));
  process.exit(1);
}
console.log("PASS");
