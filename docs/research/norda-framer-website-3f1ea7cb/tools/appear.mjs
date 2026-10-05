import { chromium, openPage } from './lib.mjs';
const [,, p, w, sel, scrollTo_] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, p, +w);
await page.waitForTimeout(2500);
await page.evaluate((y) => scrollTo(0, +y), scrollTo_);
const t0 = Date.now();
for (let i = 0; i < 16; i++) {
  const v = await page.evaluate((sel) => [...document.querySelectorAll(sel)].slice(0, 3).map(e => { const r = e.getBoundingClientRect(); let tf = []; let x = e; for (let k = 0; k < 3; k++) { tf.push(getComputedStyle(x).transform.replace('matrix(1, 0, 0, 1, ', '(').replace(/\)$/, ')') + '/op' + (+getComputedStyle(x).opacity).toFixed(2)); x = x.parentElement; } return `y${Math.round(r.y)} ${tf.join(' ')}`; }).join(' | '), sel);
  console.log(Date.now() - t0, v);
  await page.waitForTimeout(70);
}
await browser.close();
