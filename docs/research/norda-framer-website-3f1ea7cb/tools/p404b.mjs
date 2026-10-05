import { chromium, openPage } from './lib.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/404', 1440);
console.log(await page.evaluate(() => [...document.querySelectorAll('[data-framer-name="Shadow"], [data-framer-name="Shadow"] *, [data-framer-name="404"] > [data-framer-component-type]')].map(e => { const cs = getComputedStyle(e); return `${e.tagName}.${e.className.toString().slice(0, 30)} op${cs.opacity} filter:${cs.filter} color:${cs.color} z${cs.zIndex} blend:${cs.mixBlendMode}`; }).join('\n')));
console.log(await page.evaluate(() => { const els = [...document.querySelectorAll('[data-framer-cursor]')]; return els.map(e => e.getAttribute('data-framer-name') + ':' + e.getAttribute('data-framer-cursor')).slice(0, 10).join(', '); }));
await browser.close();
