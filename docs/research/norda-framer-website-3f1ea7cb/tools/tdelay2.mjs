import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto('http://localhost:3000/jobs/3d-artist', { waitUntil: 'networkidle' });
console.log(await page.evaluate(() => {
  const c = document.querySelectorAll('h1 [data-nd-c]')[2];
  const out = [];
  const cs = getComputedStyle(c);
  out.push('reveal-delay=' + cs.getPropertyValue('--nd-reveal-delay') + ' line=' + cs.getPropertyValue('--nd-line') + ' ls=' + cs.getPropertyValue('--nd-line-stagger'));
  for (const v of ['calc(0s + 0 * 0ms + 2 * 50ms)', 'calc(var(--nd-i) * var(--nd-char-stagger))', 'calc(var(--nd-reveal-delay, 0s) + var(--nd-i, 0) * var(--nd-char-stagger))', 'calc(var(--nd-line, 0) * var(--nd-line-stagger))', 'calc(var(--nd-reveal-delay, 0s))']) {
    c.style.transitionDelay = v; out.push(v + ' => ' + getComputedStyle(c).transitionDelay);
  }
  return out.join('\n');
}));
await browser.close();
