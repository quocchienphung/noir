import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto('http://localhost:3000/jobs/3d-artist', { waitUntil: 'networkidle' });
console.log(await page.evaluate(() => [...document.querySelectorAll('h1 [data-nd-c]')].slice(0, 4).map(c => { const cs = getComputedStyle(c); return `${c.textContent} style="${c.getAttribute('style')}" delay=${cs.transitionDelay} dur=${cs.transitionDuration} --i=${cs.getPropertyValue('--nd-i')} --cs=${cs.getPropertyValue('--nd-char-stagger')}`; }).join('\n')));
console.log(await page.evaluate(() => document.querySelector('h1').className));
await browser.close();
