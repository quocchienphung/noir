import { chromium, openPage } from './lib.mjs';
const OUT = 'C:/Users/quocc/Downloads/norda/docs/design-references/norda-framer-website-3f1ea7cb/root-8a5edab2/states';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/', 1440);
await page.waitForTimeout(2500);
const cur = () => page.evaluate(() => { const v = document.querySelector('.framer-PpAIo'); const r = v.getBoundingClientRect(); const kids = [...v.querySelectorAll(':scope > *')].map(k => `${k.getAttribute('data-framer-name')}:op${(+getComputedStyle(k).opacity).toFixed(2)}:${getComputedStyle(k).transform}`); return `${v.getAttribute('data-framer-name')} @${Math.round(r.x)},${Math.round(r.y)} op${getComputedStyle(v).opacity} | ${kids.join(' | ')}`; });
// hero hover
await page.mouse.move(700, 400); await page.waitForTimeout(100); await page.mouse.move(720, 420);
for (const t of [100, 300, 600]) { await page.waitForTimeout(t === 100 ? 100 : 200); console.log('hero', t, await cur()); }
await page.screenshot({ path: `${OUT}/hover-hero-cursor.jpg`, type: 'jpeg', quality: 70 });
// award row hover
const row = page.locator('[data-framer-name="List"] a').nth(2);
await row.scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
const b = await row.boundingBox();
await page.mouse.move(b.x + 300, b.y + b.height / 2); await page.waitForTimeout(100); await page.mouse.move(b.x + 320, b.y + b.height / 2);
for (const t of [100, 300, 600]) { await page.waitForTimeout(t === 100 ? 100 : 200); console.log('award', t, await cur()); }
await page.screenshot({ path: `${OUT}/hover-award-3.jpg`, type: 'jpeg', quality: 70 });
const rowStyles = await row.evaluate(e => [...e.querySelectorAll('*')].slice(0, 6).map(x => `${x.getAttribute('data-framer-name')} op${getComputedStyle(x).opacity} c${getComputedStyle(x).color}`).join(' ; '));
console.log('row styles hovered', rowStyles);
// link hover (About)
const about = page.locator('a[href="./about"]').first();
await about.scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
const ab = await about.boundingBox(); await page.mouse.move(ab.x + 20, ab.y + 20);
const charT = () => about.evaluate(e => [...e.querySelectorAll('div')].filter(d => d.childNodes.length === 1 && d.childNodes[0].nodeType === 3).slice(0, 10).map(d => getComputedStyle(d.parentElement).transform.replace('matrix(1, 0, 0, 1, ', '').replace(')', '')).join(' '));
for (let i = 0; i < 8; i++) { console.log('about hover', i * 80, await charT()); await page.waitForTimeout(80); }
await page.mouse.move(10, 10);
for (let i = 0; i < 6; i++) { console.log('about leave', i * 80, await charT()); await page.waitForTimeout(80); }
await browser.close();
