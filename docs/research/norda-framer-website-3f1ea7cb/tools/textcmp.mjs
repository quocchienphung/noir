import { chromium } from 'playwright';
const [,, p, w, text, localBase] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', localBase || 'http://localhost:3000']) {
  const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
  const page = await ctx.newPage();
  await page.goto(base + p, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate((t) => {
    const el = [...document.querySelectorAll('h1,h2,h3,h4,p,li')].find(e => e.innerText.trim().startsWith(t));
    if (!el) return 'not found';
    const cs = getComputedStyle(el);
    const range = document.createRange(); range.selectNodeContents(el);
    const rects = [...range.getClientRects()].map(r => Math.round(r.width));
    return `${el.tagName} ${cs.fontFamily.slice(0, 40)} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls${cs.letterSpacing} ws:${cs.whiteSpace} wb:${cs.wordBreak} tw:${cs.textWrap || cs.textWrapStyle} w${Math.round(el.getBoundingClientRect().width)} lines:${JSON.stringify(rects)} kern:${cs.fontKerning} feat:${cs.fontFeatureSettings} var:${cs.fontVariationSettings}`;
  }, text);
  console.log(base.slice(0, 30), r);
  await ctx.close();
}
await browser.close();
