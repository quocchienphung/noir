import { chromium } from 'playwright';
const [,, p, txt, w = '1440', base = 'https://norda.framer.website'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: +w, height: 900 } })).newPage();
await page.goto(base + p, { waitUntil: 'networkidle' });
console.log(await page.evaluate((txt) => {
  const out = []; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) {
    if (n.textContent.replace(/\s+/g, ' ').trim() !== txt) continue;
    const e = n.parentElement; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    let path = []; for (let c = e; c && path.length < 5; c = c.parentElement) path.push(c.getAttribute('data-framer-name') || c.tagName);
    out.push(`${JSON.stringify(n.textContent)} vis:${e.checkVisibility()} y${Math.round(r.top + scrollY)} x${Math.round(r.left)} ${cs.fontSize} ${cs.fontWeight} ${cs.fontFamily.slice(0, 20)} path:${path.join('<')}`);
  }
  return out.join('\n');
}, txt));
await browser.close();
