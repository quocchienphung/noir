import { chromium, openPage } from './lib.mjs';
const [,, p, classes, clickMenu] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, p, 1440);
await page.waitForTimeout(1500);
if (clickMenu) { await page.locator('header[data-framer-name="Menu Start"] a').first().click({ force: true }); await page.waitForTimeout(1500); }
const out = await page.evaluate((classes) => {
  const want = classes.split(',');
  const res = [];
  const walk = (rules, media) => { for (const r of rules) { if (r.cssRules && r.media) walk(r.cssRules, r.media.mediaText); else if (r.selectorText && want.some(c => r.selectorText.includes('.framer-' + c))) res.push((media ? '@' + media + ' ' : '') + r.cssText); } };
  for (const sh of document.styleSheets) { try { walk(sh.cssRules, ''); } catch {} }
  return res.join('\n');
}, classes);
console.log(out);
await browser.close();
