import { chromium } from 'playwright';
const [,, p, w = '390'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', process.env.LOCAL || 'http://127.0.0.1:3200']) {
  const page = await (await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } })).newPage();
  await page.goto(base + p, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } });
  await page.waitForTimeout(800);
  console.log(base.slice(8, 20), await page.evaluate(() => [...document.querySelectorAll('img')].filter(i => i.checkVisibility() && i.getBoundingClientRect().width > 200).slice(0, 8).map(i => { const r = i.getBoundingClientRect(); return `\n   rendered ${Math.round(r.width)}x${Math.round(r.height)} natural ${i.naturalWidth}x${i.naturalHeight} ratio ${(i.naturalWidth / r.width).toFixed(2)} ${(i.currentSrc.split('/').pop() || '').slice(0, 60)}`; }).join('')));
  await page.context().close();
}
await browser.close();
