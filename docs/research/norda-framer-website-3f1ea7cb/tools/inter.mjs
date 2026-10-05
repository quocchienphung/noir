import { chromium, openPage } from './lib.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/team/linnea-s%C3%B6rensen', 1440);
const reqs = [];
console.log(await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded' && f.family === 'Inter').map(f => `${f.weight} ${f.unicodeRange}`).join('\n')));
console.log(await page.evaluate(() => performance.getEntriesByType('resource').filter(e => /woff2/.test(e.name)).map(e => e.name).join('\n')));
await browser.close();
