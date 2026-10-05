import { chromium, openPage } from './lib.mjs';
const [,, w] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/news/how-architecture-shapes-productivity', +w);
console.log(await page.evaluate(() => { const c = document.querySelector('[data-framer-name="Article text"]'); return [...c.querySelectorAll('h1,h2,h3,h4,p')].map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return `${e.tagName} y${Math.round(r.top + scrollY)} h${Math.round(r.height)} w${Math.round(r.width)} ${cs.fontSize}/${cs.lineHeight} mt${cs.marginTop} mb${cs.marginBottom} ${cs.fontVariationSettings} :: ${e.innerText.slice(0, 30)}`; }).join('\n'); }));
await browser.close();
