#!/usr/bin/env node
// Text contrast over the moving scenes (prompt/04 §4): WCAG relative-luminance contrast between each text
// element's colour and the BRIGHT end (95th percentile) of the background behind it — the worst case, not the
// average — at several progress values and ambient times. Boxes are the union of the text's line boxes. Background is captured with the copy hidden
// (glyph colour made transparent, same layout), so scrims, text backings and the canvas are measured exactly
// as shown.
// Usage: node tests/qa-spacetime-contrast.mjs [baseUrl=http://localhost:3000] [outName=contrast]
// Targets: 4.5:1 for normal text, 3:1 for large text (≥ 24 px, or ≥ 18.66 px bold). Output: contrast.json.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const base = process.argv[2] || "http://localhost:3000";
const OUT = path.join(ROOT, "docs/research/noir/spacetime-qa", process.argv[3] || "contrast");
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });

const lin = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const SCENES = [
  { section: "capabilities", ps: [0.56, 0.7, 0.86], selector: "#noir-capabilities .eyebrow, #noir-capabilities h2, #noir-capabilities p, #noir-capabilities li" },
  { section: "cinematic", ps: [0.62, 0.72, 0.8], selector: "#noir-cinematic-title span, [data-noir-frame] p" },
];
const results = [];
for (const [vw, vh] of [
  [1440, 900],
  [1280, 720],
  [390, 844],
]) {
  const page = await (await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1 })).newPage();
  for (const t of [3, 9]) {
    await page.goto(`${base}/?stT=${t}&bhT=${t * 2}`, { waitUntil: "load" });
    await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
    for (const sc of SCENES) {
      for (const p of sc.ps) {
        await page.evaluate(
          ([sec, p]) => {
            const t = document.querySelector(`section[aria-labelledby="noir-${sec}-title"]`);
            const r = t.getBoundingClientRect();
            window.scrollTo(0, Math.round(scrollY + r.top + p * Math.max(0, r.height - innerHeight)));
          },
          [sc.section, p],
        );
        await page.waitForTimeout(1300);
        const boxes = await page.evaluate((sel) => {
          return [...document.querySelectorAll(sel)]
            .map((el) => {
              // the glyph lines themselves (a block's box can span far beyond its text)
              const range = document.createRange();
              range.selectNodeContents(el);
              const rects = [...range.getClientRects()].filter((q) => q.width > 1 && q.height > 1);
              const r = rects.length
                ? rects.reduce((u, q) => ({ left: Math.min(u.left, q.left), top: Math.min(u.top, q.top), right: Math.max(u.right, q.right), bottom: Math.max(u.bottom, q.bottom) }), { left: 1e9, top: 1e9, right: -1e9, bottom: -1e9 })
                : el.getBoundingClientRect();
              const cs = getComputedStyle(el);
              // effective opacity (element and ancestors)
              let o = 1;
              for (let e = el; e; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
              const m = cs.color.match(/[\d.]+/g).map(Number);
              return {
                text: el.textContent.trim().slice(0, 32),
                x: Math.max(0, Math.floor(r.left)),
                y: Math.max(0, Math.floor(r.top)),
                w: Math.floor(Math.min(r.right, innerWidth) - Math.max(0, r.left)),
                h: Math.floor(Math.min(r.bottom, innerHeight) - Math.max(0, r.top)),
                color: m,
                opacity: o,
                size: parseFloat(cs.fontSize),
                weight: parseInt(cs.fontWeight, 10),
              };
            })
            .filter((b) => b.w > 4 && b.h > 4 && b.opacity > 0.9);
        }, sc.selector);
        if (!boxes.length) continue;
        await page.addStyleTag({ content: `${sc.selector}, ${sc.selector} * { color: transparent !important; text-shadow: none !important; border-color: transparent !important }` }).then((h) => h.evaluate((n) => n.setAttribute("data-qa-hide", "")));
        await page.waitForTimeout(80);
        const shot = await page.screenshot({ type: "png" });
        await page.evaluate(() => document.querySelectorAll("[data-qa-hide]").forEach((n) => n.remove()));
        const tag = `${sc.section}-${vw}x${vh}-p${p}-t${t}`;
        fs.writeFileSync(path.join(OUT, `${tag}-bg.png`), shot);
        const { data, info } = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        for (const b of boxes) {
          const L = [];
          for (let y = b.y; y < Math.min(info.height, b.y + b.h); y++)
            for (let x = b.x; x < Math.min(info.width, b.x + b.w); x++) {
              const i = (y * info.width + x) * 3;
              L.push(lum(data[i], data[i + 1], data[i + 2]));
            }
          L.sort((a, c) => a - c);
          const bg95 = L[Math.floor(L.length * 0.95)];
          const bg50 = L[Math.floor(L.length * 0.5)];
          // text colour composited over the median background (alpha from rgba())
          const a = (b.color[3] ?? 1) * b.opacity;
          const tl = lum(...b.color.slice(0, 3)) * a + bg50 * (1 - a);
          const large = b.size >= 24 || (b.size >= 18.66 && b.weight >= 700);
          const r95 = ratio(tl, bg95);
          results.push({ tag, text: b.text, size: b.size, large, ratioP95: +r95.toFixed(2), ratioMedian: +ratio(tl, bg50).toFixed(2), pass: r95 >= (large ? 3 : 4.5) });
        }
      }
    }
  }
}
fs.writeFileSync(path.join(OUT, "contrast.json"), JSON.stringify(results, null, 2));
const fails = results.filter((r) => !r.pass);
const worst = [...results].sort((a, b) => a.ratioP95 - b.ratioP95).slice(0, 8);
console.table(worst.map((r) => ({ tag: r.tag, text: r.text, large: r.large, p95: r.ratioP95, median: r.ratioMedian })));
console.log(`${results.length} samples, ${fails.length} below target`);
await browser.close();
process.exit(fails.length ? 1 : 0);
