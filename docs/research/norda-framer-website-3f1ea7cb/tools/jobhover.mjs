import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
for (const base of ['https://norda.framer.website', 'http://localhost:3000']) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(base + '/about', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const t = page.getByText('Interior Designer', { exact: true }).filter({ visible: true }).first();
  await t.scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
  const read = () => page.evaluate(() => {
    const title = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === 'Interior Designer' && e.checkVisibility());
    let row = title; for (let i = 0; i < 8 && row; i++) { row = row.parentElement; if (row.getBoundingClientRect().height > 140) break; }
    const R = row.getBoundingClientRect(); const T = title.getBoundingClientRect();
    const arrow = [...row.querySelectorAll('*')].find(x => { const r = x.getBoundingClientRect(); return r.width >= 30 && r.width <= 48 && Math.abs(r.width - r.height) < 3 && x.checkVisibility(); });
    const line = [...row.querySelectorAll('*')].concat([row]).find(x => { const r = x.getBoundingClientRect(); return r.height <= 2 && r.width > 500; });
    const A = arrow.getBoundingClientRect(); const L = line?.getBoundingClientRect();
    const lcs = line && getComputedStyle(line);
    const disc = [...arrow.querySelectorAll('*'), arrow].map(x => getComputedStyle(x).backgroundColor).filter(c => c !== 'rgba(0, 0, 0, 0)').join(',');
    return `title x${Math.round(T.left - R.left)} w${Math.round(T.width)} | arrow x${Math.round(A.left - R.left)} disc ${disc} | line ${L ? `y${Math.round(L.top - R.top)} op${(+lcs.opacity).toFixed(2)} bg ${lcs.backgroundColor}` : '-'} | row h${Math.round(R.height)}`;
  });
  const rest = await read();
  const b = await t.boundingBox();
  await page.mouse.move(b.x + 20, b.y + b.height / 2, { steps: 5 }); await page.waitForTimeout(1000);
  console.log(base.slice(8, 18), '\n  rest ', rest, '\n  hover', await read());
  await page.context().close();
}
await browser.close();
