import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const w of [1440, 1200, 1024, 810, 390]) for (const base of ['https://norda.framer.website', 'http://localhost:3000']) {
  const page = await (await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 } })).newPage();
  await page.goto(base + '/about', { waitUntil: 'networkidle' });
  console.log(w, base.slice(0, 22), await page.evaluate(() => { const s = [...document.querySelectorAll('svg')].find(s => /NORD/.test(s.textContent) && s.checkVisibility() && s.getBoundingClientRect().width > 50); const c = s.parentElement; const cs = getComputedStyle(c); return `container ${c.offsetWidth}x${c.offsetHeight} w:${cs.width} css-left ${cs.left} top ${cs.top} right ${cs.right} bottom ${cs.bottom} pos ${cs.position} | parent ${c.parentElement.offsetWidth}x${c.parentElement.offsetHeight}`; }));
  await page.context().close();
}
await browser.close();
