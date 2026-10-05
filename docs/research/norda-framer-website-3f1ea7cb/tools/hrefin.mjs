import { chromium } from 'playwright';
const [,, p, w, hrefPart, base = 'https://norda.framer.website'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
const page = await ctx.newPage();
await page.goto(base + p, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const r = await page.evaluate((h) => [...document.querySelectorAll('a')].filter(a => (a.getAttribute('href') || '').includes(h) && a.getBoundingClientRect().width > 2).map(a => {
  const ar = a.getBoundingClientRect();
  const leaves = [...a.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim()).slice(0, 3).map(e => { const cs = getComputedStyle(e); return `${e.tagName}"${e.textContent.trim().slice(0, 12)}" ${cs.fontSize}/${cs.lineHeight} ls${cs.letterSpacing} ${cs.fontFamily.slice(0, 20)} ${cs.fontWeight} var:${cs.fontVariationSettings}`; });
  return `A href=${a.getAttribute('href')} h${Math.round(ar.height)} w${Math.round(ar.width)} y${Math.round(ar.top + scrollY)} :: ${leaves.join(' || ')}`;
}), hrefPart);
r.forEach(x => console.log(x));
await browser.close();
