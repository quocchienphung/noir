import { chromium, openPage, warm, compact } from './lib.mjs';
import fs from 'node:fs';
import { pageKey } from './keys.mjs';
const ROOT = 'C:/Users/quocc/Downloads/norda';
const SITE = 'norda-framer-website-3f1ea7cb';
const routes = JSON.parse(fs.readFileSync(`${ROOT}/docs/research/${SITE}/raw/crawl.json`, 'utf8')).map(r => r.path);
const only = process.argv[2] ? process.argv[2].split(',') : null;
const browser = await chromium.launch({ channel: 'chrome' });
async function runOne(p) {
  const key = pageKey(p);
  const raw = `${ROOT}/docs/research/${SITE}/raw/${key}`; fs.mkdirSync(raw, { recursive: true });
  const shots = `${ROOT}/docs/design-references/${SITE}/${key}/scroll`; fs.mkdirSync(shots, { recursive: true });
  for (const w of [1440, 1024, 390]) {
    const page = await openPage(browser, p, w);
    if (w === 1440) {
      fs.writeFileSync(`${raw}/appear.json`, await page.evaluate(() => document.getElementById('__framer__appearAnimationsContent')?.textContent || ''));
      fs.writeFileSync(`${raw}/head.html`, await page.evaluate(() => document.head.outerHTML.replace(/<style[\s\S]*?<\/style>/g, '<style/>')));
    }
    await warm(page);
    fs.writeFileSync(`${raw}/compact-${w}.txt`, await compact(page));
    // viewport frames, scroll gradually
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const vh = page.viewportSize().height; let i = 0;
    for (let y = 0; y < total; y += Math.round(vh * 0.85)) {
      await page.evaluate(async (t) => { const s = scrollY; for (let k = 1; k <= 6; k++) { scrollTo(0, s + (t - s) * k / 6); await new Promise(r => setTimeout(r, 40)); } }, y);
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${shots}/vp-${w}-${String(i).padStart(2, '0')}.jpg`, type: 'jpeg', quality: 65 }); i++;
      if (w === 1024 && i > 30) break;
    }
    await page.context().close();
  }
  console.log('done', p);
}
for (const p of routes) { if (only && !only.includes(p)) continue; try { await runOne(p); } catch (e) { console.log('ERR', p, String(e).slice(0, 200)); } }
await browser.close();
