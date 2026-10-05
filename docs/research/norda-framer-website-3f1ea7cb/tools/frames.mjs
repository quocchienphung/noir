// node frames.mjs <path> <width> <height> <outdir> <stepPx> [settleMs]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [,, p, w, h, outdir, step, settle] = process.argv;
fs.mkdirSync(outdir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h } });
const page = await ctx.newPage();
await page.goto('https://norda.framer.website' + p, { waitUntil: 'networkidle', timeout: 90000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
let i = 0;
for (let y = 0; y < total; y += +step) {
  // scroll gradually to y to trigger scroll animations naturally
  await page.evaluate(async (target) => { const start = scrollY; const n = 8; for (let k = 1; k <= n; k++) { scrollTo(0, start + (target - start) * k / n); await new Promise(r => setTimeout(r, 40)); } }, y);
  await page.waitForTimeout(+(settle || 1200));
  await page.screenshot({ path: `${outdir}/vp-${w}-${String(i).padStart(2,'0')}-y${y}.jpg`, type: 'jpeg', quality: 70 });
  i++;
}
console.log(total, i);
await browser.close();
