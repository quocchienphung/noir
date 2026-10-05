import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const [w, h, p, sel] of [[1440, 700, '/jobs/3d-artist', 'Quote'], [1440, 1100, '/jobs/3d-artist', 'Quote'], [1024, 900, '/', 'Testimonials'], [1440, 900, '/', 'Testimonials'], [1440, 700, '/', 'Testimonials']]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  await page.goto('https://norda.framer.website' + p, { waitUntil: 'networkidle' });
  console.log(w, h, p, await page.evaluate((sel) => { const band = document.querySelector(`[data-framer-name="${sel}"]`); const b = band.getBoundingClientRect(); const ul = [...band.querySelectorAll('ul')].find(u => /Nordå Architects/.test(u.textContent) && u.checkVisibility()); const r = ul.getBoundingClientRect(); return `band h${Math.round(b.height)} ticker top ${Math.round(r.top - b.top)} h${Math.round(r.height)} center ${((r.top - b.top + r.height / 2) / b.height).toFixed(4)}`; }, sel));
  await page.context().close();
}
await browser.close();
