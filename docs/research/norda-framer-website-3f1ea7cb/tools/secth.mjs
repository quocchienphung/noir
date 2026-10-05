import { chromium } from 'playwright';
const [,, p = '/about', sel = 'main > *, main > div > *'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
for (const h of [700, 1100]) for (const base of ['https://norda.framer.website', process.env.LOCAL || 'http://localhost:3000']) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: h } })).newPage();
  await page.goto(base + p, { waitUntil: 'networkidle' });
  console.log(h, base.slice(8, 18), await page.evaluate((sel) => [...document.querySelectorAll(sel)].filter(e => e.getBoundingClientRect().height > 100).slice(0, 14).map(e => `${(e.getAttribute('data-framer-name') || e.tagName + '.' + String(e.className).split('__')[1]?.slice(0, 10)).slice(0, 18)}:${Math.round(e.getBoundingClientRect().height)}`).join(' '), sel));
  await page.context().close();
}
await browser.close();
