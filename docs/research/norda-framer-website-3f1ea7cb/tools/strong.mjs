import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', 'http://localhost:3000']) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(base + '/privacy-policy', { waitUntil: 'networkidle' });
  console.log(base, await page.evaluate(() => { const st = [...document.querySelectorAll('strong')].find(e => e.innerText.startsWith('Service')); const cs = getComputedStyle(st); const r = st.getBoundingClientRect(); return `${cs.fontFamily.slice(0, 40)} w${cs.fontWeight} ${cs.fontVariationSettings} ${cs.fontFeatureSettings} width${Math.round(r.width)}`; }));
}
await browser.close();
