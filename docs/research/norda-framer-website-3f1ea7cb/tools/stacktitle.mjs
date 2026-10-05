import { chromium } from 'playwright';
const [,, w = '1440', base = 'https://norda.framer.website'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } })).newPage();
await page.goto(base + '/projects', { waitUntil: 'networkidle' });
const y = await page.evaluate(() => { const a = document.querySelector('a[href*="verve-tower"]'); const r = a.getBoundingClientRect(); return r.top + scrollY; });
await page.evaluate((y) => scrollTo(0, y - 60), y);
await page.waitForTimeout(1200);
console.log(await page.evaluate(() => {
  const a = [...document.querySelectorAll('a[href*="verve-tower"]')].find(x => x.getBoundingClientRect().height > 300); if (!a) return 'no card';
  const ar = a.getBoundingClientRect();
  const out = [`A ${Math.round(ar.left)},${Math.round(ar.top)} ${Math.round(ar.width)}x${Math.round(ar.height)}`];
  for (const h of a.querySelectorAll('h2, h3, p')) {
    const cs = getComputedStyle(h); const r = h.getBoundingClientRect(); const par = h.parentElement; const pcs = getComputedStyle(par); const gp = par.parentElement; const gcs = getComputedStyle(gp);
    out.push(`${h.tagName} "${h.textContent.slice(0, 20)}" ${Math.round(r.left - ar.left)},${Math.round(r.top - ar.top)} ${Math.round(r.width)}x${Math.round(r.height)} op${cs.opacity} color ${cs.color} ${cs.fontSize}/${cs.lineHeight} ls${cs.letterSpacing} | par ${par.getAttribute('data-framer-name')} op${pcs.opacity} tf ${pcs.transform} | gp ${gp.getAttribute('data-framer-name')} op${gcs.opacity} ov ${gcs.overflow} mask ${gcs.maskImage?.slice(0, 60)} tf ${gcs.transform}`);
  }
  return out.join('\n');
}));
await page.screenshot({ path: `stacktitle-${w}${base.includes('localhost') ? '-local' : ''}.png` });
await browser.close();
