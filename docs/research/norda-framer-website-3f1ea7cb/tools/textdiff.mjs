// node textdiff.mjs <width> [localBase] — per route, multiset diff of visible text-node strings (len>1)
import fs from 'node:fs';
import { chromium } from 'playwright';
const [,, w = '1440', localBase = 'http://localhost:3000'] = process.argv;
const crawl = JSON.parse(fs.readFileSync('C:/Users/quocc/Downloads/norda/docs/research/norda-framer-website-3f1ea7cb/raw/crawl.json', 'utf8'));
const browser = await chromium.launch({ channel: 'chrome' });
async function grab(url) {
  const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  const r = await page.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const p = n.parentElement;
      if (!p || p.closest('script,style,noscript,template,[id="__framer-badge-container"],[data-nd-skip]')) continue;
      if (!p.checkVisibility({ visibilityProperty: true })) continue;
      const raw = n.textContent;
      const t = raw.replace(/[ \t\n\r]+/g, ' ').trim();
      if (t.length < 2) continue;
      const sr = !!p.closest('[class*="visuallyHidden"]');
      out.push({ t: t.replace(/\u00a0/g, '⍽'), sr });
    }
    return out;
  });
  await ctx.close();
  return r;
}
const report = [];
for (const c of crawl) {
  const a = await grab('https://norda.framer.website' + c.path);
  const b = await grab(localBase + c.path);
  const count = (arr) => { const m = new Map(); for (const x of arr) m.set(x.t, (m.get(x.t) || 0) + 1); return m; };
  const ma = count(a), mb = count(b.filter((x) => !x.sr));
  const srSet = new Set(b.filter((x) => x.sr).map((x) => x.t));
  const onlyRef = [], onlyLocal = [];
  for (const [t, k] of ma) if ((mb.get(t) || 0) < k && !srSet.has(t)) onlyRef.push(t);
  for (const [t, k] of mb) if ((ma.get(t) || 0) < k) onlyLocal.push(t);
  report.push({ path: c.path, onlyRef, onlyLocal });
  console.log(`== ${c.path}  ref-only ${onlyRef.length}  local-only ${onlyLocal.length}`);
  for (const t of onlyRef) console.log('   - ' + t.slice(0, 160));
  for (const t of onlyLocal) console.log('   + ' + t.slice(0, 160));
}
fs.writeFileSync(`textdiff-${w}.json`, JSON.stringify(report, null, 1));
await browser.close();
