import { chromium, openPage } from './lib.mjs';
const [,, p] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, p, 1440);
console.log(await page.evaluate(() => { const out = []; for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) if (r instanceof CSSFontFaceRule && /v4|DXD0Q7/.test(r.cssText)) out.push(r.cssText.slice(0, 400)); } catch {} } return out.join('\n'); }));
console.log(await page.evaluate(() => [...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family}|${f.weight}|${f.style}`).join(', ')));
await browser.close();
