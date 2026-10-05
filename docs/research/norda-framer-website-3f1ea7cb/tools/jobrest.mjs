import { chromium } from 'playwright';
import { createRequire } from 'node:module';
const sharp = createRequire('C:/Users/quocc/Downloads/norda/package.json')('sharp');
const browser = await chromium.launch({ channel: 'chrome' });
const bufs = [];
for (const [p, title] of [['/about', 'Interior Designer'], ['/jobs/3d-artist', 'Interior Designer']]) for (const base of ['https://norda.framer.website', 'http://localhost:3000']) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto(base + p, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  const t = page.getByText(title, { exact: true }).filter({ visible: true }).last();
  await t.scrollIntoViewIfNeeded(); await page.waitForTimeout(700);
  const b = await t.boundingBox();
  const clip = { x: b.x - 10, y: b.y - 10, width: 380, height: 70 };
  await page.mouse.move(5, 5); await page.waitForTimeout(400);
  bufs.push(await page.screenshot({ clip }));
  await page.mouse.move(b.x + 20, b.y + b.height / 2, { steps: 5 }); await page.waitForTimeout(900);
  bufs.push(await page.screenshot({ clip }));
  await page.context().close();
}
// rows: about ref (rest,hover), about loc, jobs ref, jobs loc
await sharp({ create: { width: 770, height: 4 * 75, channels: 3, background: '#f0f' } })
  .composite(bufs.map((input, i) => ({ input, left: (i % 2) * 390, top: Math.floor(i / 2) * 75 })))
  .png().toFile('jobrest.png');
await browser.close();
