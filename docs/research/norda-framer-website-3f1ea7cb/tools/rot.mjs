import { chromium, openPage } from './lib.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/about', 1440);
await page.evaluate(() => scrollTo(0, 1800)); await page.waitForTimeout(800);
const get = () => page.evaluate(() => { const e = document.querySelector('.framer-oeead6-container'); return e ? e.style.transform + ' / ' + getComputedStyle(e).transform : 'none'; });
for (let i = 0; i < 4; i++) { console.log(Date.now() % 100000, await get()); await page.waitForTimeout(1000); }
await page.evaluate(() => scrollTo(0, 2100)); await page.waitForTimeout(300);
console.log('after scroll', await get());
await browser.close();
