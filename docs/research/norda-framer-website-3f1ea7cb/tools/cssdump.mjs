import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto('http://localhost:3000/jobs/3d-artist', { waitUntil: 'networkidle' });
console.log(await page.evaluate(() => { const out = []; for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) { const t = r.cssText; if (t.includes('char-reveal') && t.includes('armed')) out.push(t.slice(0, 600)); } } catch {} } return out.join('\n'); }));
await browser.close();
