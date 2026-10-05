import { chromium, openPage } from './lib.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/', 1440);
await page.waitForTimeout(2500);
// counters: jump so that counters block enters view
await page.evaluate(() => scrollTo(0, 1100));
const t0 = Date.now();
for (let i = 0; i < 16; i++) {
  const v = await page.evaluate(() => [...document.querySelectorAll('.framer-4gqev')].map(e => e.innerText.split('\n')[0]).join(','));
  console.log('counter t=' + (Date.now() - t0) + 'ms', v);
  await page.waitForTimeout(150);
}
await page.evaluate(() => scrollTo(0, 11800));
await page.waitForTimeout(500);
for (let i = 0; i < 5; i++) {
  const v = await page.evaluate(() => { const t = document.querySelector('[data-framer-name="Ticker Content"]'); let e = t.parentElement; const tf = []; for (let k = 0; k < 3; k++) { tf.push(getComputedStyle(e).transform); e = e.parentElement; } return Math.round(t.getBoundingClientRect().x) + ' ' + tf.join(' / '); });
  console.log('ticker t=' + i * 1000, v);
  await page.waitForTimeout(1000);
}
// testimonials: click next, sample
const btns = page.locator('[data-framer-name="Testimonials"] button');
console.log('testi buttons', await btns.count());
const snap = () => page.evaluate(() => [...document.querySelectorAll('[data-framer-name="Testimonials"] [data-framer-component-type="RichTextContainer"]')].filter(e => { const r = e.getBoundingClientRect(); return r.x >= 0 && r.x < 1440 && r.width > 0; }).map(e => e.innerText.slice(0, 50) + '@' + Math.round(e.getBoundingClientRect().x)).join(' | '));
console.log('testi before', await snap());
await btns.nth(1).click();
for (let i = 0; i < 6; i++) { await page.waitForTimeout(200); console.log('testi +' + (i + 1) * 200, await snap()); }
await page.screenshot({ path: 'C:/Users/quocc/Downloads/norda/docs/design-references/norda-framer-website-3f1ea7cb/root-8a5edab2/states/testimonial-2.jpg', type: 'jpeg', quality: 70 });
await browser.close();
