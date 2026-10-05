import { chromium } from 'playwright';
const [,, p, w, text] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
const page = await ctx.newPage();
await page.goto('https://norda.framer.website' + p, { waitUntil: 'networkidle' });
const r = await page.evaluate((t) => {
  const a = [...document.querySelectorAll('a')].find(e => e.textContent.replace(/\s+/g, ' ').includes(t) && e.getBoundingClientRect().width > 2 && e.getBoundingClientRect().height < 100);
  const out = [];
  for (const e of [a, ...a.querySelectorAll('*')]) {
    const cs = getComputedStyle(e); const b = getComputedStyle(e, '::after'); const bf = getComputedStyle(e, '::before'); const r = e.getBoundingClientRect();
    out.push(`${e.tagName} h${r.height.toFixed(1)} w${r.width.toFixed(0)} td:${cs.textDecorationLine} ${cs.textUnderlineOffset} ${cs.textDecorationThickness} bs:${cs.boxShadow} bb:${cs.borderBottom} ov:${cs.overflow} after:${b.content}/${b.height}/${b.backgroundColor} before:${bf.content}`);
  }
  return out;
}, text);
r.forEach(x => console.log(x));
await browser.close();
