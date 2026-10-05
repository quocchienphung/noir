import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const [w, h] of [[1024, 700], [1024, 1100], [390, 700], [390, 900], [1440, 700]]) for (const base of ['https://norda.framer.website', 'http://127.0.0.1:3200']) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  await page.goto(base + '/projects', { waitUntil: 'networkidle' });
  const r = await page.evaluate(() => { const a = [...document.querySelectorAll('a')].filter(x => (x.getAttribute('href') || '').includes('projects/') && x.getBoundingClientRect().height > 300 && x.checkVisibility()); return a.slice(0, 2).map(x => `${Math.round(x.getBoundingClientRect().width)}x${Math.round(x.getBoundingClientRect().height)} @${Math.round(x.getBoundingClientRect().top + scrollY)}`).join(' , ') + ' docH ' + document.documentElement.scrollHeight; });
  console.log(w, h, base.slice(8, 20), r);
  await page.context().close();
}
await browser.close();
