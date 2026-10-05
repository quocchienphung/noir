import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto('https://norda.framer.website/projects', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.locator('header[data-framer-name="Menu Start"] a, [data-framer-name="Menu"] a').first().click({ force: true });
await page.waitForTimeout(1500);
for (const [label, x, y] of [['backdrop', 300, 450], ['panel empty', 1100, 800], ['panel link', 1050, 330]]) {
  await page.mouse.move(x - 30, y - 30); await page.mouse.move(x, y, { steps: 6 }); await page.waitForTimeout(800);
  await page.screenshot({ path: `menudot-${label.replace(' ', '-')}.png`, clip: { x: x - 60, y: y - 50, width: 120, height: 100 } });
  const r = await page.evaluate(([x, y]) => [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width === 20 && r.height === 20 && Math.abs(r.left + 10 - x) < 30 && Math.abs(r.top + 10 - y) < 30 && e.checkVisibility({ opacityProperty: true }); }).map(e => getComputedStyle(e).backgroundColor).join(','), [x, y]);
  console.log(label, '->', r || 'no dot');
}
await browser.close();
