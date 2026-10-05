import { chromium } from 'playwright';
const [,, w = '1024'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', process.env.LOCAL || 'http://localhost:3000']) {
  const page = await (await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } })).newPage();
  await page.goto(base + '/jobs/3d-artist', { waitUntil: 'networkidle' });
  console.log(base.slice(8, 20), await page.evaluate(() => {
    const band = document.querySelector('[data-framer-name="Quote"]') || document.querySelector('section[aria-label="Quote"]');
    const b = band.getBoundingClientRect();
    const rel = (r) => `${Math.round(r.left)},${Math.round(r.top - b.top)} ${Math.round(r.width)}x${Math.round(r.height)}`;
    const tick = [...band.querySelectorAll('*')].find(e => e.children.length === 0 && /Nordå Architects/.test(e.textContent) && e.checkVisibility());
    const tcs = tick && getComputedStyle(tick);
    const img = [...band.querySelectorAll('img')].find(i => i.checkVisibility());
    let f = img?.parentElement; while (f && getComputedStyle(f).overflow !== 'hidden' && f !== band) f = f.parentElement;
    const q = [...band.querySelectorAll('h3,p')].find(e => /design|landscapes|looking|searching/i.test(e.textContent) && e.checkVisibility());
    return `band ${Math.round(b.width)}x${Math.round(b.height)} | ticker ${tick ? rel(tick.getBoundingClientRect()) + ' fs ' + tcs.fontSize + '/' + tcs.lineHeight + ' ' + tcs.fontFamily.slice(0, 16) + ' ' + tcs.fontWeight : '-'} | img frame ${f ? rel(f.getBoundingClientRect()) : '-'} img ${img ? rel(img.getBoundingClientRect()) : '-'} | quote ${q ? rel(q.getBoundingClientRect()) : '-'}`;
  }));
  await page.context().close();
}
await browser.close();
