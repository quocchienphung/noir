import { chromium } from 'playwright';
const [,, p, id, w = '1440'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', 'http://localhost:3000']) {
  const ctx = await browser.newContext({ viewport: { width: +w, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const r = await page.evaluate((id) => { const e = document.getElementById(id); return `scrollY ${Math.round(scrollY)} top ${Math.round(e?.getBoundingClientRect().top)} docTop ${Math.round(e.getBoundingClientRect().top + scrollY)} title ${document.title}`; }, id);
  console.log(base.slice(0, 30), r);
  await ctx.close();
}
await browser.close();
