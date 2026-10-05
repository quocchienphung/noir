import { chromium, openPage } from './lib.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
for (const p of ['/projects', '/about', '/news', '/contact']) for (const w of [1440, 1024, 390]) {
  const page = await openPage(browser, p, w);
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => { const svgs = [...document.querySelectorAll('svg[data-framer-name="Title"]')].filter(s => s.getBoundingClientRect().width > 0); return svgs.map(s => { const a = s.getBoundingClientRect(); const pr = s.parentElement.getBoundingClientRect(); const h = s.querySelector('h1'); const hr = h.getBoundingClientRect(); const cs = getComputedStyle(h); return `svg[${Math.round(a.x)},${Math.round(a.y)} ${Math.round(a.width)}x${Math.round(a.height)}] parent[${Math.round(pr.x)},${Math.round(pr.y)} ${Math.round(pr.width)}x${Math.round(pr.height)}] vb=${s.getAttribute('viewBox')} h1 ${cs.fontSize} color ${cs.color}`; }).join(' | '); });
  console.log(p, w, r);
  await page.context().close();
}
await browser.close();
