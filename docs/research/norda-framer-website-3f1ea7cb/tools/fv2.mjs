import { chromium, openPage } from './lib.mjs';
const [,, p, w] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, p, +(w || 1440));
const r = await page.evaluate(() => {
  const out = new Map();
  for (const e of document.querySelectorAll('#main *')) {
    const t = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (!t) continue;
    const cs = getComputedStyle(e);
    const k = `${cs.fontFamily.split(',')[0]} ${cs.fontWeight} ${cs.fontSize} var:${cs.fontVariationSettings} feat:${cs.fontFeatureSettings}`;
    const txt = (e.closest('a,h1,h2,h3,h4,p') || e).innerText.replace(/\s+/g, ' ').slice(0, 28);
    if (!out.has(k)) out.set(k, new Set());
    if (out.get(k).size < 4) out.get(k).add(txt);
  }
  return [...out].map(([k, v]) => k.padEnd(100) + ' | ' + [...v].join(' / ')).join('\n');
});
console.log(r);
await browser.close();
