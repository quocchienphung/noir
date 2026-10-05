import { chromium } from 'playwright';
const [,, w = '1440', y = '4800'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', process.env.LOCAL || 'http://127.0.0.1:3200']) {
  const page = await (await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } })).newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } });
  await page.evaluate((y) => scrollTo(0, y), +y);
  await page.waitForTimeout(900);
  console.log(base.slice(0, 26), await page.evaluate(() => {
    const out = [];
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) {
      const t = n.textContent.trim();
      if (!/^(Crafting|where natural|meets timeless|design for)/.test(t)) continue;
      const p = n.parentElement; if (!p.checkVisibility() || p.closest('[class*=visuallyHidden]')) continue;
      const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getBoundingClientRect();
      if (r.width < 5) continue;
      const svg = p.closest('svg'); const sr = svg?.getBoundingClientRect();
      out.push(`"${t.slice(0, 16)}" x${Math.round(r.left)} y${Math.round(r.top)} w${Math.round(r.width)} h${Math.round(r.height)} ${p.tagName}${svg ? ` svg x${Math.round(sr.left)} y${Math.round(sr.top)} ${Math.round(sr.width)}x${Math.round(sr.height)} vb ${svg.getAttribute('viewBox')}` : ''}`);
    }
    return '\n  ' + out.join('\n  ');
  }));
}
await browser.close();
