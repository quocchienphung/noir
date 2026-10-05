import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto('https://norda.framer.website/', { waitUntil: 'networkidle' });
console.log(await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button, [role=button]')].filter(b => b.checkVisibility()).map(b => { const r = b.getBoundingClientRect(); let s = b; let sec = ''; while (s) { const n = s.getAttribute && s.getAttribute('data-framer-name'); if (n && /Hero|Testimonials|Services|Process/i.test(n)) { sec = n; break; } s = s.parentElement; } return `${b.tagName} aria=${b.getAttribute('aria-label')} sec=${sec} y${Math.round(r.top + scrollY)} x${Math.round(r.left)}`; });
  const acc = [...document.querySelectorAll('[data-framer-name]')].filter(e => /Discovery & Visioning/.test(e.textContent) && e.children.length < 6 && e.checkVisibility()).slice(0, 4).map(e => `${e.tagName} ${e.getAttribute('data-framer-name')} cursor ${getComputedStyle(e).cursor} y${Math.round(e.getBoundingClientRect().top + scrollY)}`);
  return btns.join('\n') + '\n--acc\n' + acc.join('\n');
}));
await browser.close();
