import { chromium, openPage, compactFn } from './lib.mjs';
const [,, w] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/', +w);
await page.waitForTimeout(2000);
const item = page.locator('[data-framer-name$="Closed"]').first();
await item.scrollIntoViewIfNeeded(); await page.waitForTimeout(1200);
const snap = () => page.evaluate(() => { const it = document.querySelectorAll('.framer-lC31s > *')[0] || document.querySelector('[data-framer-name$="Closed"],[data-framer-name$="Open"]'); const all = [...document.querySelectorAll('[data-framer-name="Desktop Closed"],[data-framer-name="Desktop Open"],[data-framer-name="Mobile Closed"],[data-framer-name="Mobile Open"],[data-framer-name="Tablet Closed"],[data-framer-name="Tablet Open"]')].slice(0, 3); return all.map(e => { const r = e.getBoundingClientRect(); const txt = e.querySelector('[data-framer-name="Text"][class*="wn0o9s"], .framer-wn0o9s'); const icon = e.querySelector('[data-framer-name="Plus"],[data-framer-name="Minus"]'); const svgs = icon ? [...icon.querySelectorAll('svg')].map(s => getComputedStyle(s.parentElement).transform + '|op' + getComputedStyle(s.parentElement).opacity).join(',') : ''; return `${e.getAttribute('data-framer-name')} h${Math.round(r.height)} body:${txt ? Math.round(txt.getBoundingClientRect().height) + ' op' + getComputedStyle(txt).opacity : '-'} icon:${icon && icon.getAttribute('data-framer-name')} ${svgs}`; }).join(' || '); });
console.log('before', await snap());
await item.click();
for (let i = 0; i < 10; i++) { await page.waitForTimeout(80); console.log((i + 1) * 80, await snap()); }
await page.waitForTimeout(800);
console.log('settled', await snap());
await page.evaluate(() => { document.querySelector('[data-framer-name$="Open"]').id = 'nd-acc'; });
console.log(await page.evaluate(compactFn, { rootSel: '#nd-acc', vw: +w }));
await page.screenshot({ path: `C:/Users/quocc/Downloads/norda/docs/design-references/norda-framer-website-3f1ea7cb/root-8a5edab2/states/accordion-open-${w}.jpg`, type: 'jpeg', quality: 70 });
// click second item: does first close?
await page.locator('[data-framer-name$="Closed"]').first().click(); await page.waitForTimeout(1500);
console.log('after clicking another', await page.evaluate(() => [...document.querySelectorAll('[data-framer-name$="Open"],[data-framer-name$="Closed"]')].map(e => e.getAttribute('data-framer-name')).join(',')));
await browser.close();
