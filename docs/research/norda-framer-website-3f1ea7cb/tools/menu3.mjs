import { chromium, openPage } from './lib.mjs';
import fs from 'node:fs';
const [,, w] = process.argv;
const browser = await chromium.launch({ channel: 'chrome' });
const page = await openPage(browser, '/', w);
await page.waitForTimeout(800);
fs.writeFileSync(`../appear-${w}.json`, await page.evaluate(() => document.getElementById('__framer__appearAnimationsContent')?.textContent || ''));
fs.writeFileSync(`../breakpoints.json`, await page.evaluate(() => document.getElementById('__framer__breakpoints')?.textContent || ''));
await page.locator('header[data-framer-name="Menu Start"] a').first().click({ force: true });
const dump = async () => page.evaluate((vw) => {
  const fx = [...document.querySelectorAll('#main *')].filter(e => getComputedStyle(e).position === 'fixed' && Math.round(e.getBoundingClientRect().width) === vw);
  const lines = [];
  const walk = (e, d) => { if (d > 14) return; const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); const own = [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
    if (r.width > 0 || cs.display === 'contents') lines.push(`${'  '.repeat(d)}${e.tagName.toLowerCase()} ${e.getAttribute('data-framer-name') || ''} [${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}] op${cs.opacity} tf${cs.transform} bg${cs.backgroundColor} pos${cs.position} ${e.getAttribute('href') ? 'href=' + e.getAttribute('href') : ''} ${own ? `"${own}" ${cs.fontFamily.split(',')[0]} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls${cs.letterSpacing} ${cs.color}` : ''}`);
    for (const c of e.children) walk(c, d + 1); };
  fx.forEach(f => walk(f, 0));
  return lines.join('\n');
}, +w);
const timeline = [];
for (let i = 0; i < 10; i++) { timeline.push(`--- t=${i * 100}ms\n` + (await dump()).split('\n').filter(l => / (Overlay|Menu|Backdrop|Panel|Links|Close)|href=/.test(l)).slice(0, 12).join('\n')); await page.waitForTimeout(100); }
await page.waitForTimeout(1000);
console.log(timeline.join('\n'));
console.log('=== SETTLED');
console.log(await dump());
await browser.close();
