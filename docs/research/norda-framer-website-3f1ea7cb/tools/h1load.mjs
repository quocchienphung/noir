import { chromium } from 'playwright';
const [,, p = '/jobs/3d-artist', w = '1440'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__s = [];
  const t0 = performance.now();
  const tick = () => {
    const h = document.querySelector('h1');
    if (h) {
      const l = [...h.querySelectorAll('span')].filter(s => !s.children.length && s.checkVisibility());
      if (l.length) {
        const f = (s) => { const cs = getComputedStyle(s); const m = cs.transform.match(/matrix\(([^)]+)\)/); return `${(+cs.opacity).toFixed(2)}/${m ? (+m[1].split(',')[5]).toFixed(0) : 0}`; };
        window.__s.push(`${Math.round(performance.now() - t0)} n${l.length} ${f(l[0])} ${f(l[Math.floor(l.length / 2)])} ${f(l[l.length - 1])}`);
      }
    }
    if (performance.now() - t0 < 4000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
await page.goto('https://norda.framer.website' + p, { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
const s = await page.evaluate(() => window.__s);
console.log(s.filter((_, i) => i % 4 === 0).slice(0, 60).join('\n'));
await browser.close();
