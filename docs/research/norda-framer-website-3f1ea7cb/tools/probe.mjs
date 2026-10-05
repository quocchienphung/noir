// node probe.mjs <path> <width> <probes.json> <from> <to> <step>
import { chromium, openPage } from './lib.mjs';
import fs from 'node:fs';
const [,, p, w, probesFile, from, to, step] = process.argv;
const probes = JSON.parse(fs.readFileSync(probesFile, 'utf8'));
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, p, w);
await page.waitForTimeout(3500);
for (let y = +from; y <= +to; y += +step) {
  await page.evaluate(async (t) => { const s = scrollY; for (let k = 1; k <= 5; k++) { scrollTo(0, s + (t - s) * k / 5); await new Promise(r => setTimeout(r, 30)); } }, y);
  await page.waitForTimeout(700);
  const row = await page.evaluate((probes) => {
    const o = {};
    for (const [label, spec] of Object.entries(probes)) {
      const [sel, idx] = spec.split('@');
      const el = document.querySelectorAll(sel)[+(idx || 0)];
      if (!el) { o[label] = '-'; continue; }
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      o[label] = `y${Math.round(r.y)} h${Math.round(r.height)} w${Math.round(r.width)} x${Math.round(r.x)} op${(+cs.opacity).toFixed(2)} tf${cs.transform === 'none' ? '-' : cs.transform.replace('matrix', '').replace(/ /g, '')}${el.innerText && el.innerText.length < 12 ? ' "' + el.innerText.replace(/\n/g, '|') + '"' : ''}`;
    }
    return o;
  }, probes);
  console.log(`scroll ${y}: ` + Object.entries(row).map(([k, v]) => `${k}=[${v}]`).join(' '));
}
await browser.close();
