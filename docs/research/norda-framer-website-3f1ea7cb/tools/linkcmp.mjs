// node linkcmp.mjs <path> <width> "<text>" [index]
import { chromium } from 'playwright';
const [,, p, w, text, idx = '0', localBase] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', localBase || 'http://localhost:3000']) {
  const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
  const page = await ctx.newPage();
  await page.goto(base + p, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(([t, idx]) => {
    const els = [...document.querySelectorAll('a,span,p,div')].filter(e => e.innerText && e.innerText.trim() === t && e.getBoundingClientRect().width > 2);
    const el = els[+idx]; if (!el) return 'not found';
    const out = [];
    let cur = el;
    for (let i = 0; i < 4 && cur; i++, cur = cur.parentElement) {
      const cs = getComputedStyle(cur); const r = cur.getBoundingClientRect();
      out.push(`${cur.tagName} ${cs.fontFamily.slice(0, 26)} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls${cs.letterSpacing} var:${cs.fontVariationSettings} h${Math.round(r.height)} w${Math.round(r.width)} y${Math.round(r.top + scrollY)} pad:${cs.padding} bb:${cs.borderBottomWidth}`);
    }
    return out.join('\n   ');
  }, [text, idx]);
  console.log(base.slice(0, 30), '\n  ', r);
  await ctx.close();
}
await browser.close();
