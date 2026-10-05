import { chromium, openPage } from './lib.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
for (const p of process.argv.slice(2)) {
  const page = await openPage(browser, p, 1440);
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 50)); } });
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => ({ loaded: [...document.fonts].filter(f => f.status === 'loaded').map(f => `${f.family}|${f.weight}|${f.style}`).join(', '), files: performance.getEntriesByType('resource').filter(e => /woff2/.test(e.name)).map(e => e.name.split('/').pop()).join(' ') }));
  console.log(p, '\n  ', r.loaded, '\n  ', r.files);
  await page.context().close();
}
await browser.close();
