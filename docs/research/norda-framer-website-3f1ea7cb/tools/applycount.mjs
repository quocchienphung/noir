import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const w of [1440, 1024, 390]) for (const base of ['https://norda.framer.website', 'http://localhost:3000']) {
  const page = await (await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 } })).newPage();
  await page.goto(base + '/jobs/3d-artist', { waitUntil: 'networkidle' });
  console.log(w, base.slice(8, 18), await page.evaluate(() => {
    const els = [...document.querySelectorAll('a, span[role="note"]')].filter(e => /Apply\s*Now/i.test(e.textContent.replace(/(.)(?=\1)/g, '')) || /A\s*p\s*p\s*l\s*y/.test(e.textContent));
    return els.filter(e => e.checkVisibility() && e.getBoundingClientRect().width > 20).map(e => { const r = e.getBoundingClientRect(); return `${Math.round(r.left)},${Math.round(r.top + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}`; }).join(' | ');
  }));
  await page.context().close();
}
await browser.close();
