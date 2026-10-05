// node compare.mjs <path> <width> <stepPx> [maxShots] [localBase]
import { chromium } from 'playwright';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pageKey, SITE_KEY } from './keys.mjs';
const [,, p, w, step, maxShots, localBase] = process.argv;
const LOCAL = localBase || 'http://localhost:3000';
const key = pageKey(p);
const out = `C:/Users/quocc/Downloads/norda/docs/design-references/${SITE_KEY}/${key}/compare-${w}`;
fs.mkdirSync(out, { recursive: true });
const h = +w >= 810 ? 900 : 844;
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [];
async function shoot(base, tag) {
  const ctx = await browser.newContext({ viewport: { width: +w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  if (tag === 'local') {
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text().slice(0, 300)}`); });
    page.on('pageerror', e => errors.push('[pageerror] ' + String(e).slice(0, 300)));
  }
  await page.goto(base + p, { waitUntil: 'networkidle', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2500);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const files = [];
  let i = 0;
  for (let y = 0; y < total && i < +(maxShots || 40); y += +step) {
    await page.evaluate(async (t) => { const s = scrollY; for (let k = 1; k <= 6; k++) { scrollTo(0, s + (t - s) * k / 6); await new Promise(r => setTimeout(r, 40)); } }, y);
    await page.waitForTimeout(900);
    const f = `${out}/${tag}-${String(i).padStart(2, '0')}.png`;
    await page.screenshot({ path: f });
    files.push(f); i++;
  }
  await ctx.close();
  return { total, files };
}
const ref = await shoot('https://norda.framer.website', 'ref');
const loc = await shoot(LOCAL, 'local');
console.log(JSON.stringify({ refHeight: ref.total, localHeight: loc.total, shots: Math.min(ref.files.length, loc.files.length) }));
if (errors.length) console.log('LOCAL CONSOLE:\n' + [...new Set(errors)].slice(0, 20).join('\n'));
await browser.close();
