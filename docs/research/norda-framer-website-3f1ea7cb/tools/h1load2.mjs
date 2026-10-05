import { chromium } from 'playwright';
const [,, p = '/jobs/3d-artist', w = '1440', base = 'https://norda.framer.website'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__s = []; window.__ev = [];
  const t0 = performance.now();
  addEventListener('load', () => window.__ev.push('load ' + Math.round(performance.now() - t0)));
  document.addEventListener('DOMContentLoaded', () => window.__ev.push('dcl ' + Math.round(performance.now() - t0)));
  let menuAt = null;
  const tick = () => {
    const h = document.querySelector('h1');
    if (h) {
      const l = [...h.querySelectorAll('span')].filter(s => !s.children.length && s.checkVisibility() && !s.closest('[class*=visuallyHidden]'));
      if (l.length) window.__s.push([Math.round(performance.now() - t0), ...l.map(s => { const cs = getComputedStyle(s); const m = cs.transform.match(/matrix\(([^)]+)\)/); return +(+cs.opacity).toFixed(3); })]);
    }
    if (performance.now() - t0 < 5000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
await page.goto(base + p, { waitUntil: 'networkidle' });
await page.waitForTimeout(3500);
const { s, ev } = await page.evaluate(() => ({ s: window.__s, ev: window.__ev }));
console.log(ev.join(' '));
const n = s[0].length - 1;
const starts = []; const halfs = []; const dones = [];
for (let i = 1; i <= n; i++) {
  starts.push(s.find(r => r[i] > 0.005)?.[0]); halfs.push(s.find(r => r[i] >= 0.5)?.[0]); dones.push(s.find(r => r[i] >= 0.99)?.[0]);
}
console.log('start', starts.join(','), '\nhalf ', halfs.join(','), '\n0.99 ', dones.join(','));
const i0 = s.findIndex(r => r[1] > 0.005);
console.log(s.slice(i0 - 1, i0 + 16).map(r => `${r[0]}:${r[1]}`).join(' '));
await browser.close();
