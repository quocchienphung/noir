import { chromium } from 'playwright';
const [,, p, w, word, base = 'https://norda.framer.website'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: 900 } });
const page = await ctx.newPage();
await page.goto(base + p, { waitUntil: 'networkidle' });
const r = await page.evaluate((word) => {
  // find smallest element whose textContent (whitespace-stripped) starts with word, and is visible
  const cands = [...document.querySelectorAll('*')].filter(e => e.textContent.replace(/\s+/g, '').startsWith(word.replace(/\s+/g, '')) && e.getBoundingClientRect().width > 2);
  cands.sort((a, b) => a.textContent.length - b.textContent.length || b.querySelectorAll('*').length - a.querySelectorAll('*').length);
  const e = cands[0]; if (!e) return 'none';
  const leaf = [...e.querySelectorAll('*')].find(x => x.children.length === 0 && x.textContent.trim()) || e;
  const cs = getComputedStyle(leaf); const r = e.getBoundingClientRect(); const pr = e.parentElement.getBoundingClientRect();
  return `${e.tagName} h${r.height.toFixed(1)} w${r.width.toFixed(0)} parent h${pr.height.toFixed(1)} w${pr.width.toFixed(0)} leaf ${cs.fontFamily.slice(0, 22)} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls${cs.letterSpacing} var:${cs.fontVariationSettings}`;
}, word);
console.log(r);
await browser.close();
