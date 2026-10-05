import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const w of [1440, 1024, 390]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: 900 } })).newPage();
  await page.goto((process.env.BASE || 'https://norda.framer.website') + '/about', { waitUntil: 'networkidle' });
  console.log(w, await page.evaluate(() => { const s = [...document.querySelectorAll('svg')].find(s => /MEET/.test(s.textContent) && s.checkVisibility()); const t = s.querySelector('foreignObject *, text'); const cs = getComputedStyle(t); const out = [`align ${cs.textAlign} ff ${cs.fontFamily.slice(0, 20)} fw ${cs.fontWeight} fs ${cs.fontSize} lh ${cs.lineHeight} ls ${cs.letterSpacing} vb ${s.getAttribute('viewBox')}`]; const tw = document.createTreeWalker(s, NodeFilter.SHOW_TEXT); let n; while ((n = tw.nextNode())) { const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getBoundingClientRect(); const sr = s.getBoundingClientRect(); if (r.width) out.push(`"${n.textContent}" x${Math.round(r.left - sr.left)} w${Math.round(r.width)}`); } return out.join(' | '); }));
  await page.context().close();
}
await browser.close();
