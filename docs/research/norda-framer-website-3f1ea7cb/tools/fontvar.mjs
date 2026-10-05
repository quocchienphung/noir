import { chromium, openPage } from './lib.mjs';
const pages = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome' });
const combos = new Map();
for (const p of pages) {
  const page = await openPage(browser, p, 1440);
  const r = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,input,label,a,span')].filter(e => e.innerText && e.innerText.trim() && e.children.length < 3).map(e => { const cs = getComputedStyle(e); return [`${cs.fontFamily.split(',')[0]}|${cs.fontWeight}|${cs.fontSize}|var:${cs.fontVariationSettings}|feat:${cs.fontFeatureSettings}`, e.innerText.trim().slice(0, 30)]; }));
  for (const [k, t] of r) if (!combos.has(k)) combos.set(k, `${p} :: ${t}`);
  await page.context().close();
}
for (const [k, v] of combos) console.log(k.padEnd(110), v);
await browser.close();
