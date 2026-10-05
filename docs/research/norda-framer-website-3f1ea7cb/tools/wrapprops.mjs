import { chromium } from 'playwright';
const [,, p, w, sub] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: +w, height: 900 } })).newPage();
await page.goto('https://norda.framer.website' + p, { waitUntil: 'networkidle' });
console.log(await page.evaluate((sub) => {
  const el = [...document.querySelectorAll('p,h1,h2,h3')].find(e => e.textContent.includes(sub) && e.checkVisibility());
  const out = [];
  for (let e = el, i = 0; e && i < 3; e = e.parentElement, i++) { const s = getComputedStyle(e); out.push(`${e.tagName}: textWrap=${s.textWrap} style=${s.textWrapStyle} mode=${s.textWrapMode} ws=${s.whiteSpace} wordSpacing=${s.wordSpacing} indent=${s.textIndent} pad=${s.padding} maxw=${s.maxWidth} hyph=${s.hyphens} align=${s.textAlign} class=${String(e.className).slice(0, 60)}`); }
  return out.join('\n');
}, sub));
await browser.close();
