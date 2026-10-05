import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const [w, h] of [[1440, 700], [1440, 900], [1024, 700], [390, 700]]) for (const base of ['https://norda.framer.website', 'http://127.0.0.1:3200']) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  await page.goto(base + '/jobs/3d-artist', { waitUntil: 'networkidle' });
  console.log(w, h, base.slice(8, 18), await page.evaluate(() => { const out = []; for (const sel of ['main > div:first-child', '[data-framer-name="Main Image"]', '[data-framer-name="Job Info"]', '[data-framer-name="Quote"]']) { const e = document.querySelector(sel); if (e) { const r = e.getBoundingClientRect(); out.push(`${sel.slice(0, 26)} ${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.top)}`); } } const q = [...document.querySelectorAll('section, div')].find(e => /Quote/.test(e.getAttribute('aria-label') || '')); if (q) out.push('quote ' + Math.round(q.getBoundingClientRect().height)); return out.join(' | '); }));
  await page.context().close();
}
await browser.close();
