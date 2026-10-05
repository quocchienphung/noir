import { chromium, openPage, compactFn } from './lib.mjs';
const [,, w, which] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/', +w);
await page.waitForTimeout(2500);
const sel = which === 'testi' ? '[data-framer-name="Testimonials"] [data-framer-name^="Slideshow"]' : '[data-framer-name^="Slideshow"]';
if (which === 'testi') { await page.evaluate(() => document.querySelector('[data-framer-name="Testimonials"]').scrollIntoView()); await page.waitForTimeout(1500); }
await page.evaluate((sel) => {
  const ss = document.querySelector(sel);
  const slides = [...ss.querySelectorAll('ul > li > div')];
  const vis = slides.find(s => { const r = s.getBoundingClientRect(); return Math.abs(r.x) < 5; });
  vis.id = 'nd-probe';
}, sel);
console.log(await page.evaluate(compactFn, { rootSel: '#nd-probe', vw: +w }));
await browser.close();
