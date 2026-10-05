import { chromium, openPage } from './lib.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/team/linnea-s%C3%B6rensen', 1024);
console.log(await page.evaluate(() => [...document.querySelectorAll('strong')].slice(0, 3).map(st => { const cs = getComputedStyle(st); const p = getComputedStyle(st.parentElement); return `strong "${st.textContent}" fam:${cs.fontFamily.slice(0,30)} w${cs.fontWeight} feat:${cs.fontFeatureSettings} var:${cs.fontVariationSettings} numeric:${cs.fontVariantNumeric} | p feat:${p.fontFeatureSettings} numeric:${p.fontVariantNumeric} ws:${p.whiteSpace}`; }).join('\n')));
await browser.close();
