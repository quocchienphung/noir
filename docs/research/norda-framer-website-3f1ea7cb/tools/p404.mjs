import { chromium, openPage } from './lib.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/404', 1440);
await page.waitForTimeout(2500);
const st = () => page.evaluate(() => [...document.querySelectorAll('[data-framer-name="Shadow"], [data-framer-name="Top"], [data-framer-name="404"]')].map(e => `${e.getAttribute('data-framer-name')} tf${getComputedStyle(e).transform} op${getComputedStyle(e).opacity} filt${getComputedStyle(e).filter} blend${getComputedStyle(e).mixBlendMode}`).join(' | '));
console.log('rest', await st());
await page.screenshot({ path: `${process.cwd()}/../404-rest.jpg`, type: 'jpeg', quality: 70 });
for (const [x, y] of [[200, 200], [1300, 800], [720, 450]]) { await page.mouse.move(x, y, { steps: 5 }); await page.waitForTimeout(700); console.log(x, y, await st()); }
await page.mouse.move(200, 200, { steps: 5 }); await page.waitForTimeout(700);
await page.screenshot({ path: `${process.cwd()}/../404-tl.jpg`, type: 'jpeg', quality: 70 });
const lines = await page.evaluate(() => { const a = document.querySelector('a[href="./"][data-framer-name="A"]') || [...document.querySelectorAll('a')].find(a => a.getAttribute('href') === './' && a.innerText.length > 4); return a ? a.innerText.replace(/\n/g, '') : 'none'; });
console.log('link', lines);
await browser.close();
