import { chromium } from 'playwright';
const [,, w = '1440', y = '4800'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', 'http://127.0.0.1:3200']) {
  const page = await (await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } })).newPage();
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } });
  await page.evaluate((y) => scrollTo(0, y), +y);
  await page.waitForTimeout(900);
  console.log(base.slice(0, 26), await page.evaluate(() => {
    const svg = [...document.querySelectorAll('svg')].find(s => /Crafting/.test(s.textContent) && s.checkVisibility() && s.getBoundingClientRect().width > 500);
    const out = [];
    for (let e = svg, i = 0; e && i < 5; e = e.parentElement, i++) { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); out.push(`${e.tagName}.${e.getAttribute('data-framer-name') || String(e.className.baseVal ?? e.className).slice(0, 30)} x${Math.round(r.left)} y${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)} pos ${cs.position} ov ${cs.overflow} ar ${cs.aspectRatio}`); }
    return '\n  ' + out.join('\n  ');
  }));
}
await browser.close();
