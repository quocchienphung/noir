import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const [w, h] of [[390, 700], [390, 900], [1024, 700], [1440, 700]]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  await page.goto('https://norda.framer.website/', { waitUntil: 'networkidle' });
  console.log(w, h, await page.evaluate(() => { const e = document.querySelector('[data-framer-name="Testimonials"]'); return Math.round(e.getBoundingClientRect().height); }));
  await page.context().close();
}
await browser.close();
