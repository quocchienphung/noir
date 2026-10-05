import { chromium } from 'playwright';
const [,, w = '1440'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', 'http://127.0.0.1:3200']) {
  const page = await (await browser.newContext({ viewport: { width: +w, height: 900 } })).newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } });
  const out = [];
  for (const y of [3600, 3900, 4200, 4500, 4800, 5100, 5400]) {
    await page.evaluate((y) => scrollTo(0, y), y);
    await page.waitForTimeout(700);
    out.push(await page.evaluate((y) => {
      const els = [...document.querySelectorAll('h1,h2,p,span')].filter(e => e.textContent.trim().startsWith('Crafting spaces') && e.checkVisibility() && e.getBoundingClientRect().width > 50 && !e.closest('[class*=visuallyHidden]'));
      const e = els[els.length - 1]; if (!e) return y + ' none';
      const r = e.getBoundingClientRect();
      let fr = e; for (let i = 0; i < 6 && fr; i++) fr = fr.parentElement;
      return `${y}: ${e.tagName} x${Math.round(r.left)} y${Math.round(r.top)} w${Math.round(r.width)} h${Math.round(r.height)} fs ${getComputedStyle(e).fontSize}`;
    }, y));
  }
  console.log(base.slice(0, 26), '\n  ' + out.join('\n  '));
}
await browser.close();
