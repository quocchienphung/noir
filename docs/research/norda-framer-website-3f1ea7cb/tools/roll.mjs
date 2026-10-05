import { chromium, openPage } from './lib.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/', 1440);
await page.waitForTimeout(2000);
const link = page.locator('a[href="./about"]').first();
await link.scrollIntoViewIfNeeded(); await page.waitForTimeout(1500);
const b = await link.boundingBox();
const sample = () => link.evaluate(a => { const chars = [...a.querySelectorAll('div')].filter(d => d.childNodes.length === 1 && d.childNodes[0].nodeType === 3 && getComputedStyle(d).position !== 'absolute'); return chars.map(c => { const r = c.getBoundingClientRect(); return Math.round(r.y); }).join(','); });
console.log('rest', await sample());
await page.mouse.move(b.x + 10, b.y + 10);
const t0 = Date.now();
for (let i = 0; i < 14; i++) { console.log('in', Date.now() - t0, await sample()); await page.waitForTimeout(50); }
await page.mouse.move(5, 5);
const t1 = Date.now();
for (let i = 0; i < 14; i++) { console.log('out', Date.now() - t1, await sample()); await page.waitForTimeout(50); }
await browser.close();
