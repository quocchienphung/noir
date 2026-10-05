import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://localhost:3000/news', { waitUntil: 'networkidle' });
console.log(await page.evaluate(() => {
  const e = document.getElementById('main-container');
  const out = [`html scroll-padding ${getComputedStyle(document.documentElement).scrollPaddingTop} body ${getComputedStyle(document.body).scrollPaddingTop}`];
  for (let c = e; c; c = c.parentElement) { const cs = getComputedStyle(c); out.push(`${c.tagName}.${String(c.className).slice(0, 40)} smt:${cs.scrollMarginTop} tf:${cs.transform} pos:${cs.position} ov:${cs.overflow} top${Math.round(c.getBoundingClientRect().top)} mt:${cs.marginTop}`); }
  return out.join('\n');
}));
await page.evaluate(() => document.getElementById('main-container').scrollIntoView());
console.log('after scrollIntoView', await page.evaluate(() => scrollY));
await browser.close();
