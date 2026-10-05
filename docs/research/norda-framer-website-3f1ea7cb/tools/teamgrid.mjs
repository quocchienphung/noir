import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', 'http://localhost:3000']) {
  const page = await (await browser.newContext({ viewport: { width: 1024, height: 900 } })).newPage();
  await page.goto(base + '/about', { waitUntil: 'networkidle' });
  console.log(base.slice(8, 18), await page.evaluate(() => {
    const sec = document.querySelector('[data-framer-name="Meet The Team"]') || document.getElementById('meet-the-team');
    const st = sec.getBoundingClientRect().top;
    const h = [...sec.querySelectorAll('h2, svg')].find(e => /MEET/.test(e.textContent) && e.checkVisibility());
    const hr = h.getBoundingClientRect();
    const links = [...sec.querySelectorAll('a[href*="team/"]')].filter(a => a.checkVisibility() && a.getBoundingClientRect().width > 100).slice(0, 4);
    const names = [...sec.querySelectorAll('p, span, h3, h4')].filter(e => /Erik Lindholm/.test(e.textContent) && e.children.length === 0 && e.checkVisibility()).slice(0, 1).map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return `name y${Math.round(r.top - st)} h${Math.round(r.height)} ${cs.fontSize}/${cs.lineHeight}`; });
    return `title y${Math.round(hr.top - st)} h${Math.round(hr.height)} | ` + links.map(a => { const r = a.getBoundingClientRect(); return `${Math.round(r.left)},${Math.round(r.top - st)} ${r.width.toFixed(1)}x${r.height.toFixed(1)}`; }).join(' | ') + ' | ' + names.join(' ');
  }));
  await page.context().close();
}
await browser.close();
