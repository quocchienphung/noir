// node chartime.mjs <path> "<substring>" <viewportOffset> [width]
import { chromium } from 'playwright';
const [,, p, sub, off = '600', w = '1440'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
const page = await ctx.newPage();
await page.goto('https://norda.framer.website' + p, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const res = await page.evaluate(async ([sub, off]) => {
  const b = [...document.querySelectorAll('h1,h2,h3,p')].find(e => e.textContent.includes(sub) && e.checkVisibility() && e.querySelector('span'));
  const leaves = [...b.querySelectorAll('span')].filter(s => s.children.length === 0);
  const top = b.getBoundingClientRect().top + scrollY;
  const idx = [0, 1, 5, 10, 20, leaves.length - 1];
  const samples = [];
  window.scrollTo(0, top - off);
  const t0 = performance.now();
  await new Promise((res) => {
    const tick = () => {
      const t = performance.now() - t0;
      samples.push([Math.round(t), ...idx.map(i => { const cs = getComputedStyle(leaves[i]); const m = cs.transform.match(/matrix\(([^)]+)\)/); return `${(+cs.opacity).toFixed(3)}/${m ? (+m[1].split(',')[5]).toFixed(1) : 0}`; })]);
      if (t < 2600) requestAnimationFrame(tick); else res();
    };
    requestAnimationFrame(tick);
  });
  return { n: leaves.length, idx, samples, lines: b.getClientRects().length };
}, [sub, +off]);
console.log('n', res.n, 'idx', res.idx.join(','));
for (const s of res.samples.filter((_, i) => i % 3 === 0)) console.log(s.join('  '));
await browser.close();
