import fs from 'node:fs';
import { chromium } from 'playwright';
const crawl = JSON.parse(fs.readFileSync('C:/Users/quocc/Downloads/norda/docs/research/norda-framer-website-3f1ea7cb/raw/crawl.json', 'utf8'));
const [,, widths = '1440,390', local = 'http://localhost:3000'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const seenTemplates = new Set();
for (const w of widths.split(',').map(Number)) for (const c of crawl) {
  const tpl = c.path.split('/').slice(0, 2).join('/') + (c.path.split('/').length > 2 ? '/*' : '');
  if (seenTemplates.has(w + tpl)) continue; seenTemplates.add(w + tpl);
  const res = [];
  for (const base of ['https://norda.framer.website', local]) {
    const page = await (await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 } })).newPage();
    await page.goto(base + c.path, { waitUntil: 'networkidle', timeout: 120000 });
    await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 300)); });
    res.push(await page.evaluate(() => {
      const out = new Map();
      for (const img of document.querySelectorAll('img, video')) {
        if (!img.checkVisibility()) continue;
        let f = img.parentElement; while (f && f !== document.body && getComputedStyle(f).overflow !== 'hidden') f = f.parentElement;
        if (!f || f === document.body) continue; const r = f.getBoundingClientRect();
        if (r.width < 250 || r.height < 150) continue;
        const plus = [...f.querySelectorAll('svg')].filter(s => { const b = s.getBoundingClientRect(); return b.width > 4 && b.width <= 16 && s.checkVisibility(); }).length;
        out.set(`${Math.round(r.top + scrollY)}`, `y${Math.round(r.top + scrollY)} x${Math.round(r.left)} ${Math.round(r.width)}x${Math.round(r.height)} +${plus}`);
      }
      return [...out.values()];
    }));
    await page.context().close();
  }
  const [a, b] = res;
  const diffs = [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) diffs.push(`ref ${a[i] ?? '-'}  ≠  loc ${b[i] ?? '-'}`);
  console.log(`${w} ${c.path}: ${a.length} ref / ${b.length} local frames${diffs.length ? '\n   ' + diffs.join('\n   ') : ' — identical'}`);
}
await browser.close();
