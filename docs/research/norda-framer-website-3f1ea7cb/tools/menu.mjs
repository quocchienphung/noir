import { chromium, openPage, compact } from './lib.mjs';
import fs from 'node:fs';
const [,, w] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/', w);
await page.waitForTimeout(800);
const before = await page.evaluate(() => document.querySelectorAll('body *').length);
await page.locator('header[data-framer-name="Menu Start"] a, header[data-framer-name="Menu"] a').first().click({ force: true });
await page.waitForTimeout(1500);
// find newly visible fixed overlay
const out = await page.evaluate(() => {
  const els = [...document.querySelectorAll('body *')].filter(e => { const cs = getComputedStyle(e); return cs.position === 'fixed' && e.getBoundingClientRect().width > 100; });
  return els.map(e => `${e.tagName} ${e.getAttribute('data-framer-name')} ${JSON.stringify(e.getBoundingClientRect())} z${getComputedStyle(e).zIndex} bg${getComputedStyle(e).backgroundColor} op${getComputedStyle(e).opacity}`).join('\n');
});
console.log(out);
console.log('-----');
console.log(await compact(page, 'body'));
await page.screenshot({ path: `C:/Users/quocc/Downloads/norda/docs/design-references/norda-framer-website-3f1ea7cb/root-8a5edab2/states/menu-open-${w}.jpg`, type: 'jpeg', quality: 75 });
await browser.close();
