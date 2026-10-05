import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const [p, id] of [['/news', 'main-container'], ['/about', 'job-openings'], ['/about', 'main-container'], ['/', 'main-container'], ['/team/erik-lindholm', 'main-container']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('https://norda.framer.website' + p, { waitUntil: 'networkidle' });
  console.log(p, id, await page.evaluate((id) => { const e = document.getElementById(id); return e ? `smt:${getComputedStyle(e).scrollMarginTop}` : 'missing'; }, id));
  await ctx.close();
}
await browser.close();
