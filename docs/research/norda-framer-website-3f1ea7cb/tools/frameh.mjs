import { chromium } from 'playwright';
const routes = (process.env.ROUTES || '/about,/team/erik-lindholm').split(',');
const browser = await chromium.launch({ channel: 'chrome' });
for (const [w, h] of [[1440, 700], [1024, 700], [390, 700], [1440, 1100]]) for (const p of routes) {
  const res = [];
  for (const base of ['https://norda.framer.website', process.env.LOCAL || 'http://127.0.0.1:3200']) {
    const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
    await page.goto(base + p, { waitUntil: 'networkidle' });
    res.push(await page.evaluate(() => {
      const frames = new Set();
      for (const img of document.querySelectorAll('img')) {
        if (!img.checkVisibility()) continue;
        let f = img.parentElement; while (f && f !== document.body && getComputedStyle(f).overflow !== 'hidden') f = f.parentElement;
        if (!f || f === document.body) continue; const r = f.getBoundingClientRect();
        if (r.width < 300 || r.height < 300) continue; frames.add(`${Math.round(r.width)}x${Math.round(r.height)}`);
      }
      return [...frames].join(' ') + ' | doc ' + document.documentElement.scrollHeight;
    }));
    await page.context().close();
  }
  console.log(`${w}x${h} ${p}\n  ref ${res[0]}\n  loc ${res[1]}`);
}
await browser.close();
