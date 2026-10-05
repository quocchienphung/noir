import { chromium } from 'playwright';
const routes = (process.argv[2] || '/projects,/news,/about,/contact').split(',');
const browser = await chromium.launch({ channel: 'chrome' });
for (const w of [1440, 1024, 390]) for (const p of routes) {
  const res = [];
  for (const base of ['https://norda.framer.website', process.env.LOCAL || 'http://127.0.0.1:3200']) {
    const page = await (await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 } })).newPage();
    await page.goto(base + p, { waitUntil: 'networkidle' });
    res.push(await page.evaluate(() => [...document.querySelectorAll('svg')].filter(s => s.textContent.trim().length > 3 && s.checkVisibility() && s.getBoundingClientRect().width > 150).map(s => {
      const r = s.getBoundingClientRect(); const pr = s.parentElement.getBoundingClientRect();
      return `"${s.textContent.trim().slice(0, 10)}" svg ${Math.round(r.left)},${Math.round(r.top + scrollY)} ${Math.round(r.width)}x${Math.round(r.height)} parent ${Math.round(pr.width)}x${Math.round(pr.height)}`;
    }).join(' | ')));
    await page.context().close();
  }
  console.log(`${w} ${p}\n  ref ${res[0]}\n  loc ${res[1]}`);
}
await browser.close();
