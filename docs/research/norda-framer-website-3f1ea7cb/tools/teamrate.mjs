import { chromium, openPage } from './lib.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/about', 1440);
await page.waitForTimeout(1500);
const snap = async (y) => { await page.evaluate(async (t) => { const s = scrollY; for (let k = 1; k <= 6; k++) { scrollTo(0, s + (t - s) * k / 6); await new Promise(r => setTimeout(r, 40)); } }, y); await page.waitForTimeout(600); return page.evaluate(() => { const par = document.querySelector('.framer-1qv6hcm').getBoundingClientRect().top; return [...document.querySelectorAll('.framer-1069ou8')].map(m => Math.round(m.getBoundingClientRect().top - par) + ':' + m.querySelector('a').getAttribute('href').split('/').pop()); }); };
const a = await snap(2600), b = await snap(3400), c = await snap(4200);
console.log(a.map((x, i) => `${x}  ${b[i].split(':')[0]}  ${c[i].split(':')[0]}`).join('\n'));
await browser.close();
