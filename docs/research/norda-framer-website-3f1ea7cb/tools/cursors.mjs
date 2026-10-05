import { chromium, openPage } from './lib.mjs';
const [,, p] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, p, 1440);
console.log(await page.evaluate(() => { const m = {}; for (const e of document.querySelectorAll('[data-framer-cursor]')) { const k = e.getAttribute('data-framer-cursor'); (m[k] ||= []).push(`${e.tagName}:${e.getAttribute('data-framer-name') || ''}:${(e.innerText || '').replace(/\s+/g, ' ').slice(0, 18)}`); } return Object.entries(m).map(([k, v]) => `${k} (${v.length}) ${[...new Set(v)].slice(0, 12).join(' | ')}`).join('\n'); }));
await browser.close();
