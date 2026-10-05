import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', 'http://localhost:3000']) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(base + '/privacy-policy', { waitUntil: 'networkidle' });
  console.log(base, await page.evaluate(() => [...document.querySelectorAll('li')].filter(l => /Service Providers|Legal Compliance/.test(l.innerText)).map(l => { const r = l.getBoundingClientRect(); const cs = getComputedStyle(l); return `y${Math.round(r.top)} h${Math.round(r.height)} w${Math.round(r.width)} mt${cs.marginTop} pl${cs.paddingLeft} ${cs.fontSize}/${cs.lineHeight} ${getComputedStyle(l.parentElement).marginTop}`; }).join(' | ')));
}
await browser.close();
