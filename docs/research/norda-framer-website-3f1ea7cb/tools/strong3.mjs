import { chromium, openPage } from './lib.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
for (const p of ['/', '/team/linnea-s%C3%B6rensen', '/privacy-policy', '/jobs/interior-designer', '/about']) {
  const page = await openPage(browser, p, 1440);
  const r = await page.evaluate(() => {
    const st = [...new Set([...document.querySelectorAll('strong')].map(s => { const cs = getComputedStyle(s); return `${cs.fontFamily.split(',')[0]} ${cs.fontWeight} ${cs.fontVariationSettings} :: ${s.textContent.slice(0, 18)}`; }))];
    const loaded = [...document.fonts].filter(f => f.status === 'loaded' && /Inter/.test(f.family)).map(f => `${f.family} ${f.weight} ${f.unicodeRange.slice(0, 30)}`);
    return st.slice(0, 6).join(' | ') + '\n   loaded Inter: ' + loaded.join(' ; ');
  });
  console.log(p, r);
  await page.context().close();
}
await browser.close();
