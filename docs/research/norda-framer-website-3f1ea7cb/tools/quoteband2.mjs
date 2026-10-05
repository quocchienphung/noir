import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', process.env.LOCAL || 'http://localhost:3000']) {
  const page = await (await browser.newContext({ viewport: { width: 1024, height: 900 } })).newPage();
  await page.goto(base + '/jobs/3d-artist', { waitUntil: 'networkidle' });
  console.log(base.slice(8, 20), await page.evaluate(() => {
    const band = document.querySelector('[data-framer-name="Quote"]') || document.querySelector('section[aria-label="Quote"]');
    const b = band.getBoundingClientRect();
    const chain = (el, n) => { const out = []; for (let e = el, i = 0; e && e !== band && i < n; e = e.parentElement, i++) { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); out.push(`${(e.getAttribute('data-framer-name') || e.tagName + '.' + String(e.className).split('__')[1]?.slice(0, 8))} ${Math.round(r.left)},${Math.round(r.top - b.top)} ${Math.round(r.width)}x${Math.round(r.height)} pad:${cs.padding} pos:${cs.position} top:${cs.top}`); } return out.join('\n     < '); };
    const tick = [...band.querySelectorAll('*')].find(e => e.children.length === 0 && /Nordå Architects/.test(e.textContent) && e.checkVisibility());
    const img = [...band.querySelectorAll('img')].find(i => i.checkVisibility());
    return '\n  TICKER ' + chain(tick, 6) + '\n  IMG ' + chain(img, 5);
  }));
  await page.context().close();
}
await browser.close();
