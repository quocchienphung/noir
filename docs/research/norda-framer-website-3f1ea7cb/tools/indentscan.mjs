import fs from 'node:fs';
import { chromium } from 'playwright';
const crawl = JSON.parse(fs.readFileSync('C:/Users/quocc/Downloads/norda/docs/research/norda-framer-website-3f1ea7cb/raw/crawl.json', 'utf8'));
const browser = await chromium.launch({ channel: 'chrome' });
const seen = new Map();
for (const w of [1440, 1024, 390]) for (const c of crawl) {
  for (const base of ['https://norda.framer.website', 'http://127.0.0.1:3200']) {
    const page = await (await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 } })).newPage();
    await page.goto(base + c.path, { waitUntil: 'networkidle', timeout: 120000 });
    const r = await page.evaluate(() => [...document.querySelectorAll('p,h1,h2,h3,h4,li')].filter(e => e.checkVisibility() && getComputedStyle(e).textIndent !== '0px' && e.textContent.trim()).map(e => `${e.textContent.trim().slice(0, 30)} :: ${getComputedStyle(e).textIndent}`));
    const k = base.includes('framer') ? 'ref' : 'loc';
    for (const x of r) { const key = `${w} ${x}`; const v = seen.get(key) || { ref: [], loc: [] }; v[k].push(c.path); seen.set(key, v); }
    await page.context().close();
  }
}
for (const [k, v] of seen) console.log(k, '| ref', v.ref.length, '| loc', v.loc.length, v.ref.length !== v.loc.length ? '  <-- MISMATCH ' + [...new Set(v.ref)].slice(0, 4).join(',') : '');
await browser.close();
