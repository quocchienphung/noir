// node charstarts.mjs <path> "<substring>" [width] [tag] — start time per leaf after scrolling block to 600px from top
import { chromium } from 'playwright';
const [,, p, sub, w = '1440', tag = 'h1,h2,h3,p', base = 'https://norda.framer.website'] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
const page = await ctx.newPage();
await page.goto(base + p, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const res = await page.evaluate(async ([sub, tag]) => {
  const b = [...document.querySelectorAll(tag)].find(e => e.textContent.includes(sub) && e.checkVisibility() && e.querySelector('span') && Math.abs(e.getBoundingClientRect().left) < innerWidth);
  const leaves = [...b.querySelectorAll('span')].filter(s => s.children.length === 0 && !s.closest('[class*=visuallyHidden]'));
  const top = b.getBoundingClientRect().top + scrollY;
  window.scrollTo(0, top - 600);
  const t0 = performance.now();
  const start = new Array(leaves.length).fill(null), half = new Array(leaves.length).fill(null);
  const y0 = leaves.map(() => null);
  await new Promise((res) => { const tick = () => { const t = performance.now() - t0; leaves.forEach((l, i) => { const o = +getComputedStyle(l).opacity; if (y0[i] === null) { const m = getComputedStyle(l).transform.match(/matrix\(([^)]+)\)/); y0[i] = m ? +m[1].split(',')[5] : 0; } if (start[i] === null && o > 0.005) start[i] = Math.round(t); if (half[i] === null && o >= 0.5) half[i] = Math.round(t); }); if (t < 4000) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
  const lineOf = leaves.map(l => Math.round(l.getBoundingClientRect().top));
  return leaves.map((l, i) => `${l.textContent}:${start[i]}/${half[i]}/L${lineOf[i]}/y${y0[i]}`);
}, [sub, tag]);
console.log(res.join(' '));
await browser.close();
