import fs from 'node:fs';
import { chromium } from 'playwright';
const [,, w = '1440', filter = ''] = process.argv;
const crawl = JSON.parse(fs.readFileSync('C:/Users/quocc/Downloads/norda/docs/research/norda-framer-website-3f1ea7cb/raw/crawl.json', 'utf8'));
const browser = await chromium.launch({ channel: 'chrome' });
for (const c of crawl.filter((c) => !filter || filter.split(',').includes(c.path))) {
  const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
  const page = await ctx.newPage();
  await page.goto('https://norda.framer.website' + c.path, { waitUntil: 'networkidle', timeout: 120000 });
  const r = await page.evaluate(() => {
    const out = [];
    for (const b of document.querySelectorAll('h1,h2,h3,h4,h5,h6,p')) {
      if (b.closest('a,button') || !b.checkVisibility()) continue;
      const leaves = [...b.querySelectorAll('span')].filter(s => s.children.length === 0);
      if (leaves.length < 4) continue;
      const single = leaves.filter(s => s.textContent.length === 1).length;
      const kind = single / leaves.length > 0.8 ? 'char' : 'word/line';
      const cs = getComputedStyle(leaves[0]);
      const r = b.getBoundingClientRect();
      out.push(`${kind} y${Math.round(r.top + scrollY)} n${leaves.length} op${(+cs.opacity).toFixed(2)} tf:${cs.transform} ${b.tagName} "${b.textContent.slice(0, 50)}"`);
    }
    return out;
  });
  console.log('== ' + c.path); r.forEach(x => console.log('  ' + x));
  await ctx.close();
}
await browser.close();
