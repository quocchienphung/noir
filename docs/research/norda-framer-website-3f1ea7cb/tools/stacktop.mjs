import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const [w, h] of [[1440, 700], [1440, 900], [1440, 1100], [1280, 900], [1920, 1080]]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  await page.goto('https://norda.framer.website/projects', { waitUntil: 'networkidle' });
  await page.evaluate(() => scrollTo(0, 2600)); await page.waitForTimeout(800);
  const r = await page.evaluate(() => { const a = [...document.querySelectorAll('a')].find(x => (x.getAttribute('href') || '').includes('projects/verve') && x.getBoundingClientRect().height > 300 && x.checkVisibility()); const st = a.closest('[style*=sticky], *'); let s = a; while (s && getComputedStyle(s).position !== 'sticky') s = s.parentElement; const cs = s ? getComputedStyle(s) : null; return `card top ${Math.round(a.getBoundingClientRect().top)} h${Math.round(a.getBoundingClientRect().height)} w${Math.round(a.getBoundingClientRect().width)} | sticky el top:${cs?.top} h${s ? Math.round(s.getBoundingClientRect().height) : '-'}`; });
  console.log(w, h, r);
  await page.context().close();
}
await browser.close();
