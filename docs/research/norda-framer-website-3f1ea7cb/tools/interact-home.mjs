import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = 'C:/Users/quocc/Downloads/norda/docs/design-references/norda-framer-website-3f1ea7cb/root-8a5edab2/states';
fs.mkdirSync(OUT, { recursive: true });
const log = [];
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('https://norda.framer.website/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
// hero over time
const heroInfo = async () => page.evaluate(() => {
  const ul = document.querySelector('[data-framer-name="Slideshow Desktop"] ul');
  const vis = [...document.querySelectorAll('[data-framer-name="Slideshow Desktop"] [data-framer-name="Info"]')].map(i => { const r = i.getBoundingClientRect(); return { x: Math.round(r.x), t: i.innerText.replace(/\n/g, ' | ') }; }).filter(o => o.x > -10 && o.x < 1440);
  return { tf: ul && getComputedStyle(ul).transform, vis };
});
for (let t = 0; t <= 12; t += 1) { log.push({ t, hero: await heroInfo() }); if (t % 3 === 0) await page.screenshot({ path: `${OUT}/hero-t${t}.jpg`, type: 'jpeg', quality: 70 }); await page.waitForTimeout(1000); }
// click next arrow & sample transition
const next = page.locator('[data-framer-name="Slideshow Desktop"] button').nth(1);
await next.click();
for (let k = 0; k < 10; k++) { log.push({ afterNextMs: k * 100, hero: await heroInfo() }); await page.waitForTimeout(100); }
await page.screenshot({ path: `${OUT}/hero-after-next.jpg`, type: 'jpeg', quality: 70 });
// menu open
await page.locator('header[data-framer-name="Menu Start"] a').first().click().catch(e => log.push({ menuErr: String(e) }));
for (const ms of [100, 300, 600, 1200]) { await page.waitForTimeout(ms === 100 ? 100 : ms - [100,300,600,1200][[100,300,600,1200].indexOf(ms)-1]); await page.screenshot({ path: `${OUT}/menu-open-${ms}.jpg`, type: 'jpeg', quality: 70 }); }
fs.writeFileSync(`${OUT}/menu-open-dom.html`, await page.content());
log.push({ menuText: await page.evaluate(() => document.body.innerText.slice(0, 3000)) });
fs.writeFileSync(`${OUT}/../raw-interact-log.json`, JSON.stringify(log, null, 1));
await browser.close();
