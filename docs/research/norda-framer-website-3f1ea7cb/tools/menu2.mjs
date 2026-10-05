import { chromium, openPage, compactFn } from './lib.mjs';
const [,, w] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/', w);
await page.waitForTimeout(800);
console.log(await page.evaluate(() => [...document.body.children].map(c => c.tagName + '#' + c.id + '.' + c.className).join('\n')));
const trigger = page.locator('header[data-framer-name="Menu Start"] a').first();
const t0 = Date.now();
await trigger.click({ force: true });
const samples = [];
for (let i = 0; i < 12; i++) {
  samples.push(await page.evaluate(() => { const o = document.querySelector('#overlay'); if (!o) return 'no overlay'; return [...o.querySelectorAll('*')].filter(e => e.getAttribute('data-framer-name') || getComputedStyle(e).position === 'fixed').slice(0, 8).map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return `${e.getAttribute('data-framer-name')}:${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)}x${Math.round(r.height)} op${cs.opacity} tf${cs.transform} bg${cs.backgroundColor}`; }).join(' || '); }));
  await page.waitForTimeout(80);
}
samples.forEach((s, i) => console.log(`t~${i * 80 + 0}ms`, s.slice(0, 700)));
await page.waitForTimeout(1200);
console.log('=====');
console.log(await page.evaluate(compactFn, { rootSel: '#overlay', vw: +w }));
await browser.close();
