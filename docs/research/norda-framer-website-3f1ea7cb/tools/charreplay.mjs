import { chromium } from 'playwright';
const [,, p, sub, w = '1440'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
const page = await ctx.newPage();
await page.goto('https://norda.framer.website' + p, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const vh = +w >= 810 ? 900 : 844;
const state = (label) => page.evaluate(([sub, label]) => {
  const b = [...document.querySelectorAll('h1,h2,h3,p')].find(e => e.textContent.includes(sub) && e.checkVisibility() && e.querySelector('span'));
  const leaves = [...b.querySelectorAll('span')].filter(s => s.children.length === 0);
  const r = b.getBoundingClientRect();
  const lineTops = [...new Set(leaves.map(l => Math.round(l.getBoundingClientRect().top - getComputedStyle(l).transform.split(',')[5]?.replace(')', '') || 0)))];
  const cs = getComputedStyle(leaves[0]); const par = leaves[0].parentElement; const pcs = getComputedStyle(par);
  return `${label}: top ${Math.round(r.top)} bottom ${Math.round(r.bottom)} op0 ${(+cs.opacity).toFixed(2)} tf ${cs.transform} | leaf display ${cs.display} parent ${par.tagName} ${pcs.display} ws:${pcs.whiteSpace} | lines ${b.getClientRects().length}`;
}, [sub, label]);
const top = await page.evaluate((sub) => { const b = [...document.querySelectorAll('h1,h2,h3,p')].find(e => e.textContent.includes(sub) && e.checkVisibility() && e.querySelector('span')); return b.getBoundingClientRect().top + scrollY; }, sub);
for (const [label, y] of [['below+40', top - vh - 40], ['below+5', top - vh - 5], ['edge', top - vh], ['in+20', top - vh + 20], ['far-below', top - vh - 600], ['in again', top - 500], ['above (scrolled past)', top + 1500], ['back', top - 500]]) {
  await page.evaluate((y) => scrollTo(0, y), y);
  await page.waitForTimeout(1300);
  console.log(await state(label));
}
await browser.close();
