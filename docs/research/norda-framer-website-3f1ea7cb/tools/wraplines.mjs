import { chromium } from 'playwright';
const [,, p, w, sub, base = 'https://norda.framer.website'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } })).newPage();
await page.goto(base + p, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
console.log(await page.evaluate((sub) => {
  const el = [...document.querySelectorAll('p,h1,h2,h3')].find(e => e.textContent.includes(sub) && e.checkVisibility());
  const tn = [...el.childNodes].find(n => n.nodeType === 3) || el.firstChild;
  const text = tn.textContent; const lines = []; let cur = ''; let lastTop = null;
  const rg = document.createRange();
  for (let i = 0; i < text.length; i++) { rg.setStart(tn, i); rg.setEnd(tn, i + 1); const r = rg.getClientRects()[0]; if (!r) { cur += text[i]; continue; } const t = Math.round(r.top); if (lastTop !== null && t > lastTop + 5) { lines.push(cur); cur = ''; } lastTop = t; cur += text[i]; }
  lines.push(cur);
  const cs = getComputedStyle(el); let anc = []; for (let e = el; e && anc.length < 4; e = e.parentElement) { const s = getComputedStyle(e); anc.push(`${e.tagName} w${Math.round(e.getBoundingClientRect().width)} tf ${s.transform} ff ${s.fontFamily.slice(0, 20)} fv ${s.fontVariationSettings} ff ${s.fontFeatureSettings}`); }
  return lines.map(l => JSON.stringify(l)).join('\n') + '\n' + anc.join('\n');
}, sub));
await browser.close();
