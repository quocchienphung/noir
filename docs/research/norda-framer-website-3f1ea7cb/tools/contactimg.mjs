import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const w of [390, 1024, 1440]) for (const base of ['https://norda.framer.website', process.env.LOCAL || 'http://127.0.0.1:3200']) {
  const page = await (await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 } })).newPage();
  await page.goto(base + '/contact', { waitUntil: 'networkidle' });
  console.log(w, base.slice(8, 18), await page.evaluate(() => { const imgs = [...document.querySelectorAll('img')].filter(i => i.checkVisibility() && i.getBoundingClientRect().width > 250 && i.getBoundingClientRect().top + scrollY > 1200 ); return imgs.map(i => { let f = i.parentElement; while (f && getComputedStyle(f).overflow !== "hidden") f = f.parentElement; if (!f) return "nof"; const r = f.getBoundingClientRect(); const plus = f.querySelectorAll('svg').length; return `frame x${Math.round(r.left)} y${Math.round(r.top + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)} svgs ${plus}`; }).join(' | '); }));
  await page.context().close();
}
await browser.close();
