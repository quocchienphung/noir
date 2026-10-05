import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto('http://localhost:3000/about', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
const t = page.getByText('Interior Designer', { exact: true }).filter({ visible: true }).first();
await t.scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
const b = await t.boundingBox();
await page.evaluate(() => {
  const title = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === 'Interior Designer' && e.checkVisibility());
  let row = title; for (let i = 0; i < 8 && row; i++) { row = row.parentElement; if (row.getBoundingClientRect().height > 140) break; }
  const arrow = [...row.querySelectorAll('*')].find(x => { const r = x.getBoundingClientRect(); return r.width >= 30 && r.width <= 48 && Math.abs(r.width - r.height) < 3 && x.checkVisibility(); });
  const line = [...row.querySelectorAll('*')].concat([row]).find(x => { const r = x.getBoundingClientRect(); return r.height <= 2 && r.width > 500; });
  window.__s = []; const R = row.getBoundingClientRect();
  const tick = () => { window.__s.push([Math.round(performance.now()), +(arrow.getBoundingClientRect().left - R.left).toFixed(1), +(+getComputedStyle(line).opacity).toFixed(3)]); if (window.__s.length < 120) requestAnimationFrame(tick); };
  window.__start = () => { window.__t0 = performance.now(); requestAnimationFrame(tick); };
});
await page.evaluate(() => window.__start());
await page.mouse.move(b.x + 20, b.y + b.height / 2);
await page.waitForTimeout(1500);
const s = await page.evaluate(() => { const t0 = window.__t0; return window.__s.map(([t, x, o]) => `${t - Math.round(t0)}:${x}/${o}`); });
console.log(s.filter((_, i) => i % 3 === 0).join(' '));
await browser.close();
