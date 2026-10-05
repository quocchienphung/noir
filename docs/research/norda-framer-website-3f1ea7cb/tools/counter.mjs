import { chromium, openPage } from './lib.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/', 1440);
await page.waitForTimeout(2500);
await page.evaluate(() => scrollTo(0, 1150));
for (let i = 0; i < 8; i++) {
  const v = await page.evaluate(() => [...document.querySelectorAll('.framer-4gqev [data-framer-component-type="RichTextContainer"]')].slice(0, 3).map(e => { let p = e; const tfs = []; for (let k = 0; k < 3; k++) { const cs = getComputedStyle(p); tfs.push(`${cs.transform}|op${cs.opacity}`); p = p.parentElement; } return e.innerText + ':' + Math.round(e.getBoundingClientRect().y) + ':' + tfs.join(','); }).join('  ##  '));
  console.log(i * 60, v);
  await page.screenshot({ path: `${process.cwd()}/../counter-${i}.jpg`, clip: { x: 376, y: 400, width: 700, height: 500 }, type: 'jpeg', quality: 60 });
  await page.waitForTimeout(40);
}
await browser.close();
