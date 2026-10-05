import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('https://norda.framer.website/', { waitUntil: 'networkidle' });
console.log(await page.evaluate(() => {
  const sec = document.querySelector('[data-framer-name="Testimonials"]');
  const names = [...new Set([...sec.querySelectorAll('[data-framer-name]')].map(e => e.getAttribute('data-framer-name')))];
  const quotes = [...sec.querySelectorAll('h3')].map(h => { const r = h.getBoundingClientRect(); return `x${Math.round(r.left)} ${h.textContent.slice(0, 20)}`; });
  const btns = [...sec.querySelectorAll('button,[role=button],[aria-label]')].map(b => `${b.tagName} ${b.getAttribute('aria-label')} ${Math.round(b.getBoundingClientRect().left)},${Math.round(b.getBoundingClientRect().top)}`);
  return names.join(',') + '\n' + quotes.join('\n') + '\n' + btns.join('\n');
}));
await browser.close();
