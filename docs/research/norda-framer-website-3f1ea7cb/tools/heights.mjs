import { chromium } from 'playwright';
import fs from 'node:fs';
const [,, w, local] = process.argv;
const routes = JSON.parse(fs.readFileSync('C:/Users/quocc/Downloads/norda/docs/research/norda-framer-website-3f1ea7cb/raw/crawl.json', 'utf8')).map(r => r.path);
const browser = await chromium.launch({ channel: 'chrome' });
async function measure(base, p) {
  const ctx = await browser.newContext({ viewport: { width: +w, height: +w >= 810 ? 900 : 844 } });
  const page = await ctx.newPage();
  await page.goto(base + p, { waitUntil: 'networkidle', timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } scrollTo(0, 0); await new Promise(r => setTimeout(r, 500)); });
  const r = await page.evaluate(() => { const el = [...document.querySelectorAll('h2,p')].find(e => e.innerText.trim().startsWith('Sign up for our')); return { h: document.documentElement.scrollHeight, s: el ? Math.round(el.getBoundingClientRect().top + scrollY) : null }; });
  await ctx.close(); return r;
}
for (const p of routes) { const a = await measure('https://norda.framer.website', p); const b = await measure(local || 'http://localhost:3000', p); console.log(`${p.padEnd(55)} H ${a.h} vs ${b.h} (Δ${b.h - a.h})  signup ${a.s} vs ${b.s} (Δ${b.s - a.s})`); }
await browser.close();
