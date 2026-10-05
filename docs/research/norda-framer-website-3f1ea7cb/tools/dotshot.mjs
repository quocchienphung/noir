import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto('https://norda.framer.website/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3300);
const shots = [];
for (const [label, y, x, py] of [['intro text', 1300, 700, 300], ['counters', 2000, 400, 400], ['awards', 5400, 700, 400], ['footer', 14300, 400, 300], ['services text', 8800, 300, 400]]) {
  await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(600);
  await page.mouse.move(x - 50, py - 50); await page.mouse.move(x, py, { steps: 8 }); await page.waitForTimeout(800);
  await page.screenshot({ path: `dot-${label.replace(' ', '-')}.png`, clip: { x: x - 100, y: py - 70, width: 200, height: 140 } });
  shots.push(label);
}
console.log(shots.join(','));
await browser.close();
