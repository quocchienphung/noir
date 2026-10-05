// node anchors.mjs <path> <width> "<text1>|<text2>|..." [localBase]
import { chromium } from 'playwright';
const [,, p, w, texts, localBase] = process.argv;
const list = texts.split('|');
const browser = await chromium.launch({ channel: 'chrome' });
async function measure(base) {
  const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
  const page = await ctx.newPage();
  await page.goto(base + p, { waitUntil: 'networkidle', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 800)); });
  const res = await page.evaluate((list) => list.map(t => {
    const els = [...document.querySelectorAll('h1,h2,h3,h4,p,span,a,li,div')].filter(e => e.children.length === 0 || e.matches('p,h1,h2,h3,h4'));
    const el = els.find(e => (e.innerText || '').replace(/\s+/g, ' ').trim().startsWith(t));
    if (!el) return [t, null];
    const r = el.getBoundingClientRect();
    return [t, `y${Math.round(r.top + scrollY)} x${Math.round(r.left)} w${Math.round(r.width)} h${Math.round(r.height)}`];
  }), list);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  await ctx.close();
  return { res, total };
}
const a = await measure('https://norda.framer.website');
const b = await measure(localBase || 'http://localhost:3000');
console.log('height', a.total, b.total);
for (let i = 0; i < list.length; i++) console.log(list[i].slice(0, 28).padEnd(30), String(a.res[i][1]).padEnd(32), b.res[i][1]);
await browser.close();
