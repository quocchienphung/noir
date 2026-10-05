import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const w of [1440, 1024, 390]) for (const base of ['https://norda.framer.website', process.env.LOCAL || 'http://localhost:3000']) {
  const page = await (await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 } })).newPage();
  await page.goto(base + '/about', { waitUntil: 'networkidle' });
  const find = () => page.evaluate(() => { const s = [...document.querySelectorAll('svg')].find(s => /NORD/.test(s.textContent) && s.checkVisibility() && s.getBoundingClientRect().width > 50); if (!s) return null; const r = s.getBoundingClientRect(); let a = []; for (let e = s.parentElement, i = 0; e && i < 3; e = e.parentElement, i++) { const er = e.getBoundingClientRect(); a.push(`${e.getAttribute('data-framer-name') || String(e.className).slice(0, 24)} ${Math.round(er.left)},${Math.round(er.top + scrollY)} ${Math.round(er.width)}x${Math.round(er.height)} tf ${getComputedStyle(e).transform.slice(0, 40)}`); } return { y: r.top + scrollY, s: `svg ${Math.round(r.left)},${Math.round(r.top + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)} vb ${s.getAttribute('viewBox')} | ${a.join(' < ')}` }; });
  const f = await find();
  if (!f) { console.log(w, base.slice(0, 22), 'none'); continue; }
  const out = [];
  for (const off of [900, 600, 300]) { await page.evaluate((y) => scrollTo(0, y), f.y - off); await page.waitForTimeout(800); out.push(off + ': ' + (await find()).s); }
  console.log(w, base.slice(0, 22), '\n   ' + out.join('\n   '));
  await page.context().close();
}
await browser.close();
