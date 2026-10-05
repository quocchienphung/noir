import { chromium, openPage } from './lib.mjs';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/about', 1440);
await page.waitForTimeout(1500);
await page.evaluate(() => scrollTo(0, 3300)); await page.waitForTimeout(1200);
const m = page.locator('.framer-1069ou8').nth(5);
const st = () => m.evaluate(e => { const out = []; for (const x of [e, e.querySelector('a'), e.querySelector('section'), e.querySelector('img'), e.querySelector('.framer-1oy64pl')]) { if (!x) continue; const cs = getComputedStyle(x); const r = x.getBoundingClientRect(); out.push(`${x.tagName}[${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] op${(+cs.opacity).toFixed(2)} tf${cs.transform} filt${cs.filter} z${cs.zIndex}`); } return out.join(' | '); });
console.log('rest ', await st());
const b = await m.boundingBox(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
for (const t of [100, 300, 600]) { await page.waitForTimeout(t === 100 ? 100 : 200); console.log('hover' + t, await st()); }
await page.screenshot({ path: 'C:/Users/quocc/Downloads/norda/docs/design-references/norda-framer-website-3f1ea7cb/about-979bddc4/team-hover.jpg', type: 'jpeg', quality: 70 });
console.log(await page.evaluate(() => document.querySelector('.framer-PpAIo')?.getAttribute('data-framer-name')));
await browser.close();
