import { chromium } from 'playwright';
const [,, base = 'https://norda.framer.website', from = '1200', to = '6600', step = '300'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(base + '/projects', { waitUntil: 'networkidle' });
await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } });
const slugs = ['verve-tower', 'harbor-12', 'nordic-one', 'summit-24', 'str'];
for (let y = +from; y <= +to; y += +step) {
  await page.evaluate((y) => scrollTo(0, y), y);
  await page.waitForTimeout(350);
  const r = await page.evaluate((slugs) => slugs.map(sl => {
    const a = [...document.querySelectorAll('a')].find(x => (x.getAttribute('href') || '').includes('projects/' + sl) && x.getBoundingClientRect().height > 300 && x.checkVisibility());
    if (!a) return sl.slice(0, 5) + ':-';
    // clipping frame: deepest element with overflow hidden containing the image
    const img = a.querySelector('img');
    let fr = img?.parentElement; while (fr && fr !== a && getComputedStyle(fr).overflow !== 'hidden') fr = fr.parentElement;
    const f = (fr || a).getBoundingClientRect(); const ar = a.getBoundingClientRect();
    const h = a.querySelector('h2, [class*=name]'); const hr = h?.getBoundingClientRect();
    return `${sl.slice(0, 5)} card ${Math.round(ar.top)} | frame ${Math.round(f.left)},${Math.round(f.top)} ${Math.round(f.width)}x${Math.round(f.height)} | name y${hr ? Math.round(hr.top) : '-'} x${hr ? Math.round(hr.left) : '-'}`;
  }).filter(s => !/card -?\d{4,}/.test(s) || true), slugs);
  console.log(`y${y}: ` + r.filter(s => { const m = s.match(/card (-?\d+)/); return m && +m[1] > -800 && +m[1] < 1000; }).join('  ||  '));
}
await browser.close();
