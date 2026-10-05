import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { SITE_KEY, pageKey } from './keys.mjs';
const ROOT = 'C:/Users/quocc/Downloads/norda';
const ORIGIN = 'https://norda.framer.website';
const seeds = fs.readFileSync(process.argv[2], 'utf8').split(/\s+/).filter(Boolean);
const queue = [...seeds]; const seen = new Set(); const manifest = [];
const browser = await chromium.launch({ channel: 'chrome' });
async function autoScroll(page) {
  await page.evaluate(async () => {
    const step = 400; let y = 0;
    while (y < document.documentElement.scrollHeight) { window.scrollTo(0, y); y += step; await new Promise(r => setTimeout(r, 120)); }
    await new Promise(r => setTimeout(r, 800));
    window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 600));
  });
}
while (queue.length) {
  const p = queue.shift(); if (seen.has(p)) continue; seen.add(p);
  const key = pageKey(p);
  const rawDir = path.join(ROOT, 'docs/research', SITE_KEY, 'raw', key);
  const shotDir = path.join(ROOT, 'docs/design-references', SITE_KEY, key);
  fs.mkdirSync(rawDir, { recursive: true }); fs.mkdirSync(shotDir, { recursive: true });
  const entry = { path: p, key };
  for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const resp = await page.goto(ORIGIN + p, { waitUntil: 'networkidle', timeout: 90000 }).catch(e => null);
    entry[`status${vp.w}`] = resp?.status();
    await page.evaluate(() => document.fonts.ready);
    await autoScroll(page);
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(shotDir, `ref-full-${vp.w}.png`), fullPage: true });
    if (vp.w === 1440) {
      entry.title = await page.title();
      fs.writeFileSync(path.join(rawDir, 'dom-1440.html'), await page.content());
      const data = await page.evaluate(() => ({
        links: [...document.querySelectorAll('a[href]')].map(a => ({ href: a.href, text: a.innerText.trim().slice(0, 120) })),
        images: [...document.querySelectorAll('img')].map(i => ({ src: i.getAttribute('src'), currentSrc: i.currentSrc, srcset: i.getAttribute('srcset'), sizes: i.getAttribute('sizes'), alt: i.alt, nw: i.naturalWidth, nh: i.naturalHeight })),
        videos: [...document.querySelectorAll('video')].map(v => ({ src: v.currentSrc || v.src, poster: v.poster, autoplay: v.autoplay, loop: v.loop, muted: v.muted })),
        meta: [...document.querySelectorAll('meta,link[rel]')].map(m => m.outerHTML),
        height: document.documentElement.scrollHeight,
      }));
      fs.writeFileSync(path.join(rawDir, 'page-data-1440.json'), JSON.stringify(data, null, 1));
      entry.height1440 = data.height;
      for (const l of data.links) {
        try { const u = new URL(l.href); if (u.origin === ORIGIN && !seen.has(u.pathname) && !queue.includes(u.pathname)) queue.push(u.pathname); } catch {}
      }
    } else {
      fs.writeFileSync(path.join(rawDir, 'dom-390.html'), await page.content());
      entry.height390 = await page.evaluate(() => document.documentElement.scrollHeight);
    }
    await ctx.close();
  }
  manifest.push(entry); console.log(JSON.stringify(entry));
}
fs.writeFileSync(path.join(ROOT, 'docs/research', SITE_KEY, 'raw', 'crawl.json'), JSON.stringify(manifest, null, 1));
await browser.close();
