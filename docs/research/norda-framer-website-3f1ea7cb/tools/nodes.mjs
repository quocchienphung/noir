// node nodes.mjs <path> <width> "<substring>" [base] — show the text nodes around the block containing substring
import { chromium } from 'playwright';
const [,, p, w, sub, base = 'https://norda.framer.website'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: 900 } });
const page = await ctx.newPage();
await page.goto(base + p, { waitUntil: 'networkidle' });
const r = await page.evaluate((sub) => {
  const blocks = [...document.querySelectorAll('p,h1,h2,h3,h4,li,figcaption,blockquote')].filter(e => e.textContent.includes(sub) && e.checkVisibility());
  return blocks.slice(0, 3).map(b => {
    const nodes = []; const tw = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) nodes.push(`[${n.parentElement.tagName}${getComputedStyle(n.parentElement).fontWeight}]${JSON.stringify(n.textContent)}`);
    return `${b.tagName}: ${nodes.join(' ')}`.slice(0, 700);
  });
}, sub);
r.forEach(x => console.log(x));
await browser.close();
