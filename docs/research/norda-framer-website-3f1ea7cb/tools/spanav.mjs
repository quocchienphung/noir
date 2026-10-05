import { chromium } from 'playwright';
const [,, base = 'https://norda.framer.website', from = '/about', hrefPart = 'jobs/3d-artist'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(base + from, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.evaluate((hrefPart) => {
  window.__s = [];
  const a = [...document.querySelectorAll('a')].find(x => (x.getAttribute('href') || '').includes(hrefPart) && x.getBoundingClientRect().width > 0);
  a.scrollIntoView();
  window.__t0 = performance.now();
  const tick = () => {
    const h = document.querySelector('h1');
    if (h && location.pathname.includes('jobs')) {
      const l = [...h.querySelectorAll('span')].filter(s => !s.children.length && s.checkVisibility() && !s.closest('[class*=visuallyHidden]'));
      if (l.length) window.__s.push([Math.round(performance.now() - window.__t0), +(+getComputedStyle(l[0]).opacity).toFixed(3), +(+getComputedStyle(l[l.length - 1]).opacity).toFixed(3)]);
    }
    if (performance.now() - window.__t0 < 5000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  a.click();
}, hrefPart);
await page.waitForTimeout(5200);
const s = await page.evaluate(() => window.__s);
console.log('first sample', s[0], 'start', s.find(r => r[1] > 0.005)?.[0], 'last start', s.find(r => r[2] > 0.005)?.[0], 'url', page.url());
await browser.close();
