// node shot.mjs <url> <width> <scrollY> <out> [settleMs]
import { chromium } from 'playwright';
const [,, url, w, y, out, settle] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(1500);
await page.evaluate(async (t) => { const s = scrollY; for (let k = 1; k <= 10; k++) { scrollTo(0, s + (t - s) * k / 10); await new Promise(r => setTimeout(r, 40)); } }, +y);
await page.waitForTimeout(+(settle || 1000));
await page.screenshot({ path: out, type: 'jpeg', quality: 75 });
await browser.close();
