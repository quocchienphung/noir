import { chromium } from 'playwright';
import { createRequire } from 'node:module';
const sharp = createRequire('C:/Users/quocc/Downloads/norda/package.json')('sharp');
const browser = await chromium.launch({ channel: 'chrome' });
const bufs = [];
for (const [base, sel] of [['https://norda.framer.website', 'a[href*="team/erik"]'], ['http://localhost:3000', '#meet-the-team a[href*="erik"]']]) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(base + '/about', { waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
  const el = page.locator(sel).filter({ visible: true }).first();
  await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
  const b = await el.boundingBox();
  const clip = { x: b.x - 12, y: b.y - 12, width: b.width + 24, height: b.height + 24 };
  await page.mouse.move(5, 5); await page.waitForTimeout(500);
  bufs.push(await page.screenshot({ clip }));
  console.log(base.slice(8, 18), await page.evaluate((sel) => { const a = [...document.querySelectorAll(sel)].find(e => e.checkVisibility()); const n = [...a.querySelectorAll('*')].find(e => e.children.length === 0 && /erik lindholm/i.test(e.textContent)); let o = 1; for (let e = n; e && e !== a.parentElement; e = e.parentElement) o *= +getComputedStyle(e).opacity; return 'effective name opacity at rest ' + o.toFixed(2); }, sel));
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 5 }); await page.waitForTimeout(900);
  bufs.push(await page.screenshot({ clip }));
  await page.context().close();
}
const metas = await Promise.all(bufs.map(b => sharp(b).metadata()));
await sharp({ create: { width: metas.reduce((s, m) => s + m.width + 8, 0), height: Math.max(...metas.map(m => m.height)), channels: 3, background: '#f0f' } })
  .composite(bufs.map((input, i) => ({ input, left: metas.slice(0, i).reduce((s, m) => s + m.width + 8, 0), top: 0 }))).png().toFile('teamrest.png');
await browser.close();
