import { chromium } from 'playwright';
const [,, p, sub, w = '1440'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: 900 } });
const page = await ctx.newPage();
await page.goto('https://norda.framer.website' + p, { waitUntil: 'networkidle' });
const probe = (label) => page.evaluate(([sub, label]) => {
  const b = [...document.querySelectorAll('h1,h2,h3,p')].find(e => e.textContent.includes(sub) && e.checkVisibility() && e.querySelector('span'));
  if (!b) return label + ' none';
  const spans = [...b.querySelectorAll('span')].filter(s => s.children.length === 0);
  const r = b.getBoundingClientRect();
  const pick = [0, 1, 2, 10, 30, Math.floor(spans.length / 2), spans.length - 1].filter(i => spans[i]);
  return `${label} blockTop ${Math.round(r.top)} n${spans.length} ` + pick.map(i => { const cs = getComputedStyle(spans[i]); return `#${i}"${spans[i].textContent}" op${(+cs.opacity).toFixed(2)} tf:${cs.transform} f:${cs.filter} c:${cs.color}`; }).join(' | ');
}, [sub, label]);
console.log(await probe('load'));
const top = await page.evaluate((sub) => { const b = [...document.querySelectorAll('h1,h2,h3,p')].find(e => e.textContent.includes(sub) && e.checkVisibility() && e.querySelector('span')); return b.getBoundingClientRect().top + scrollY; }, sub);
for (const off of [900, 750, 600, 450, 300, 100]) {
  await page.evaluate((y) => scrollTo(0, y), top - off);
  await page.waitForTimeout(700);
  console.log(await probe(`top@${off}`));
}
await browser.close();
