import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', 'http://localhost:3000']) {
  const page = await (await browser.newContext({ viewport: { width: 1024, height: 900 } })).newPage();
  await page.goto(base + '/about', { waitUntil: 'networkidle' });
  console.log(base.slice(8, 18), await page.evaluate(() => {
    const main = document.querySelector('[data-framer-name="Main Container"]') || document.getElementById('main-container');
    return [...main.children].filter(e => e.getBoundingClientRect().height > 50).map(e => `${(e.getAttribute('data-framer-name') || e.tagName).slice(0, 14)}:${Math.round(e.getBoundingClientRect().height)}@${Math.round(e.getBoundingClientRect().top + scrollY)}`).join(' ');
  }));
  await page.context().close();
}
await browser.close();
