// node linkin.mjs <path> <width> "<link text>"  — dumps text leaves inside the first matching <a>
import { chromium } from 'playwright';
const [,, p, w, text, localBase] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', localBase || 'http://localhost:3000']) {
  const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
  const page = await ctx.newPage();
  await page.goto(base + p, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate((t) => {
    const a = [...document.querySelectorAll('a')].find(e => e.textContent.replace(/\s+/g, ' ').includes(t) && e.getBoundingClientRect().width > 2 && e.getBoundingClientRect().height < 400);
    if (!a) return ['not found'];
    const ar = a.getBoundingClientRect();
    const out = [`A h${Math.round(ar.height)} w${Math.round(ar.width)} y${Math.round(ar.top + scrollY)}`];
    for (const e of a.querySelectorAll('*')) {
      const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
      if (r.width < 1) continue;
      out.push(`${e.tagName} "${(e.children.length ? '' : e.textContent).slice(0, 14)}" ${cs.fontFamily.slice(0, 24)} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls${cs.letterSpacing} var:${cs.fontVariationSettings} h${Math.round(r.height)} w${Math.round(r.width)} y${Math.round(r.top - ar.top)} x${Math.round(r.left - ar.left)} bb:${cs.borderBottomWidth} gap:${cs.gap}`);
    }
    return out.slice(0, 14);
  }, text);
  console.log(base.slice(0, 30)); r.forEach(x => console.log('  ', x));
  await ctx.close();
}
await browser.close();
