import { chromium, openPage } from './lib.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/', 1440);
await page.waitForTimeout(2000);
for (const y of [3500, 3900, 4300, 4700, 5100]) {
  await page.evaluate(async (t) => { const s = scrollY; for (let k = 1; k <= 8; k++) { scrollTo(0, s + (t - s) * k / 8); await new Promise(r => setTimeout(r, 40)); } }, y);
  await page.waitForTimeout(700);
  const info = await page.evaluate(() => { let e = document.querySelector('.framer-1dxbykp svg'); const chain = []; for (let k = 0; k < 7 && e; k++) { const cs = getComputedStyle(e); chain.push(`${e.tagName}.${(e.getAttribute('class')||'').split(' ')[0]} op${cs.opacity} blend:${cs.mixBlendMode} pos:${cs.position} top:${cs.top} fill:${cs.fill} filter:${cs.filter} tf:${cs.transform}`); e = e.parentElement; } return chain.join('\n   '); });
  console.log('scroll', y, '\n  ', info);
}
await browser.close();
