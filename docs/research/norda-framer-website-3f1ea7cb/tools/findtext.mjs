import { chromium } from 'playwright';
const [,, p, w, text] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: 900 } });
const page = await ctx.newPage();
await page.goto('https://norda.framer.website' + p, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const r = await page.evaluate((t) => [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim().toLowerCase() === t.toLowerCase()).map(e => {
  const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
  let a = e.closest('a'); const ar = a?.getBoundingClientRect();
  return `${e.tagName} "${e.textContent.trim()}" ${cs.fontFamily.slice(0, 24)} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls${cs.letterSpacing} var:${cs.fontVariationSettings} h${Math.round(r.height)} w${Math.round(r.width)} y${Math.round(r.top + scrollY)} | a:${a ? `h${Math.round(ar.height)} w${Math.round(ar.width)} href=${a.getAttribute('href')}` : 'none'}`;
}), text);
r.forEach(x => console.log(x));
await browser.close();
