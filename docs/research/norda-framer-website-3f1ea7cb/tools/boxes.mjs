// node boxes.mjs <path> <width> "<css selector for ref>" "<css selector for local>"
import { chromium } from 'playwright';
const [,, p, w, selA, selB, localBase] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
for (const [base, sel] of [['https://norda.framer.website', selA], [localBase || 'http://localhost:3000', selB]]) {
  const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
  const page = await ctx.newPage();
  await page.goto(base + p, { waitUntil: 'networkidle', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 800)); });
  const r = await page.evaluate((sel) => [...document.querySelectorAll(sel)].slice(0, 12).map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return `${e.tagName}.${(e.getAttribute('data-framer-name')||e.className.toString().slice(0,30))} y${Math.round(r.top+scrollY)} h${Math.round(r.height)} x${Math.round(r.left)} w${Math.round(r.width)} pad:${cs.padding} gap:${cs.gap}`; }), sel);
  console.log(base.slice(0, 30)); r.forEach(x => console.log('  ', x));
  await ctx.close();
}
await browser.close();
