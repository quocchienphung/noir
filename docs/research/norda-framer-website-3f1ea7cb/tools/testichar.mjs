import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('https://norda.framer.website/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const sample = (label) => page.evaluate((label) => {
  const sec = document.querySelector('[data-framer-name="Testimonials"]');
  const hs = [...sec.querySelectorAll('h3')].filter(h => { const r = h.getBoundingClientRect(); return r.left > -10 && r.left < innerWidth && r.width > 0; });
  return label + ' ' + hs.map(h => { const l = [...h.querySelectorAll('span')].filter(s => !s.children.length); const r = h.getBoundingClientRect(); const a = h.closest('li')?.parentElement; return `[x${Math.round(r.left)} "${h.textContent.slice(1, 14)}" op ${l.slice(0, 1).concat(l.slice(-1)).map(s => (+getComputedStyle(s).opacity).toFixed(2)).join('/')}]`; }).join(' ');
}, label);
await page.evaluate(() => { const s = document.querySelector('[data-framer-name="Testimonials"]'); scrollTo(0, s.getBoundingClientRect().top + scrollY - 100); });
await page.waitForTimeout(100);
console.log(await sample('t+100'));
await page.waitForTimeout(1600);
console.log(await sample('t+1700'));
const clicked = await page.evaluate(() => { const b = document.querySelector('[data-framer-name="Testimonials"] button[aria-label="Next"]'); const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
console.log('next', clicked);
if (Array.isArray(clicked)) {
  await page.locator('[data-framer-name="Testimonials"] button[aria-label="Next"]').click();
  for (const t of [50, 200, 400, 700, 1000, 1500]) { await page.waitForTimeout(t === 50 ? 50 : 200); console.log(await sample('after-next ~' + t)); }
}
await browser.close();
