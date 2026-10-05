import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const h of [700, 900, 1100]) for (const base of ['https://norda.framer.website', process.env.LOCAL || 'http://localhost:3000']) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: h } })).newPage();
  await page.goto(base + '/about', { waitUntil: 'networkidle' });
  console.log(h, base.slice(8, 18), await page.evaluate(() => {
    const sec = document.querySelector('[data-framer-name="Meet The Team"]') || document.getElementById('meet-the-team');
    const st = sec.getBoundingClientRect().top;
    const links = [...sec.querySelectorAll('a[href*="team/"]')].filter(a => a.checkVisibility() && a.getBoundingClientRect().width > 100);
    return `sec h${Math.round(sec.getBoundingClientRect().height)} | ` + links.map(a => { const r = a.getBoundingClientRect(); return `${decodeURIComponent(a.getAttribute('href')).split('/').pop().slice(0, 5)} ${Math.round(r.left)},${Math.round(r.top - st)} ${Math.round(r.width)}x${Math.round(r.height)}`; }).join(' | ');
  }));
  await page.context().close();
}
await browser.close();
