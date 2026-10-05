import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const [w, h, p, sel] of [[1440, 700, '/jobs/3d-artist', 'section[aria-label="Quote"]'], [1440, 1100, '/jobs/3d-artist', 'section[aria-label="Quote"]'], [1024, 900, '/jobs/3d-artist', 'section[aria-label="Quote"]'], [1024, 900, '/', 'section[aria-label="Testimonials"]'], [1440, 900, '/', 'section[aria-label="Testimonials"]'], [1440, 700, '/', 'section[aria-label="Testimonials"]']]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  await page.goto('http://localhost:3000' + p, { waitUntil: 'networkidle' });
  console.log(w, h, p, await page.evaluate((sel) => { const band = document.querySelector(sel); const b = band.getBoundingClientRect(); const t = band.querySelector('[class*="ticker-module"]'); const r = t.getBoundingClientRect(); return `band h${Math.round(b.height)} ticker top ${Math.round(r.top - b.top)} h${Math.round(r.height)}`; }, sel));
  await page.context().close();
}
await browser.close();
