import { chromium, openPage } from './lib.mjs';
const [,, w] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/', +w);
console.log(await page.evaluate(() => { const L = document.querySelector('[data-framer-name="Logotypes"]'); const out = []; const walk = (e, d) => { if (d > 4) return; const r = e.getBoundingClientRect(); out.push(`${'  '.repeat(d)}${e.tagName} ${e.getAttribute('data-framer-name') || ''} [${Math.round(r.x)},${Math.round(r.y + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}] ${getComputedStyle(e).display} gap${getComputedStyle(e).gap}`); [...e.children].slice(0, 3).forEach(c => walk(c, d + 1)); }; walk(L, 0); return out.join('\n'); }));
await browser.close();
