import fs from 'node:fs';
import { chromium } from 'playwright';
const crawl = JSON.parse(fs.readFileSync('C:/Users/quocc/Downloads/norda/docs/research/norda-framer-website-3f1ea7cb/raw/crawl.json', 'utf8'));
const [,, widths = '390,1024,1440', base = 'http://127.0.0.1:3200'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const seen = new Set();
for (const w of widths.split(',').map(Number)) for (const c of crawl) {
  const tpl = c.path.split('/').slice(0, 2).join('/') + (c.path.split('/').length > 2 ? '/*' : '');
  if (seen.has(w + tpl)) continue; seen.add(w + tpl);
  const page = await (await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 } })).newPage();
  await page.goto(base + c.path, { waitUntil: 'networkidle', timeout: 120000 });
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } });
  await page.waitForLoadState('networkidle');
  const r = await page.evaluate(() => [...document.querySelectorAll('img')].filter(i => i.naturalWidth && i.getBoundingClientRect().width > 100 && !/\.svg/.test(i.currentSrc)).map(i => {
    const b = i.getBoundingClientRect(); const fit = getComputedStyle(i).objectFit;
    const scale = fit === 'cover' ? Math.max(b.width / i.naturalWidth, b.height / i.naturalHeight) : Math.min(b.width / i.naturalWidth, b.height / i.naturalHeight);
    const url = decodeURIComponent(i.currentSrc).match(/([A-Za-z0-9_-]+)\.(jpg|png|webp)/)?.[1]?.slice(0, 10);
    return { url, box: `${Math.round(b.width)}x${Math.round(b.height)}`, nat: `${i.naturalWidth}x${i.naturalHeight}`, up: +scale.toFixed(2) };
  }).filter(x => x.up > 1.15));
  const uniq = [...new Map(r.map(x => [x.url + x.box, x])).values()];
  console.log(`${w} ${c.path}: ${uniq.length} under-resolved` + uniq.slice(0, 6).map(x => `\n   ${x.url} box ${x.box} natural ${x.nat} upscale ×${x.up}`).join(''));
  await page.context().close();
}
await browser.close();
