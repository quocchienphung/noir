import { chromium } from 'playwright';
const [,, p = '/about', w = '1024', ys = '1200,1800,2400'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', process.env.LOCAL || 'http://localhost:3000']) {
  const page = await (await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } })).newPage();
  await page.goto(base + p, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } });
  const out = [];
  for (const y of ys.split(',').map(Number)) {
    await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(600);
    out.push(y + ': ' + await page.evaluate(() => [...document.querySelectorAll('img')].filter(i => { const r = i.getBoundingClientRect(); return r.width > 300 && r.bottom > 0 && r.top < innerHeight && i.checkVisibility(); }).slice(0, 3).map(i => { const r = i.getBoundingClientRect(); let fr = i.parentElement; while (fr && getComputedStyle(fr).overflow !== 'hidden' && fr !== document.body) fr = fr.parentElement; const f = fr.getBoundingClientRect(); return `[${(i.currentSrc || '').split('/').pop().split('?')[0].slice(0, 12)} img y${Math.round(r.top - f.top)} h${Math.round(r.height)} frame top${Math.round(f.top)} h${Math.round(f.height)} fit ${getComputedStyle(i).objectPosition}]`; }).join(' ')));
  }
  console.log(base.slice(0, 24), '\n  ' + out.join('\n  '));
}
await browser.close();
