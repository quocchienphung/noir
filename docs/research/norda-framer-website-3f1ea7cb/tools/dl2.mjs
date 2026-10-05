import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__log = [];
  const t0 = performance.now();
  const rec = (k) => { const e = document.getElementById('main-container'); window.__log.push(`${Math.round(performance.now() - t0)} ${k} sy${Math.round(scrollY)} top${e ? Math.round(e.getBoundingClientRect().top + scrollY) : '-'} sh${document.documentElement.scrollHeight}`); };
  addEventListener('scroll', () => rec('scroll'));
  document.addEventListener('DOMContentLoaded', () => rec('dcl'));
  addEventListener('load', () => rec('load'));
  const o = Element.prototype.scrollIntoView; Element.prototype.scrollIntoView = function (...a) { rec('scrollIntoView ' + this.id); return o.apply(this, a); };
  const s = window.scrollTo; window.scrollTo = function (...a) { rec('scrollTo ' + JSON.stringify(a)); return s.apply(this, a); };
});
await page.goto('http://localhost:3000/news#main-container', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
console.log((await page.evaluate(() => window.__log)).slice(0, 30).join('\n'));
await browser.close();
