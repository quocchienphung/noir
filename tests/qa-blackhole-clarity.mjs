#!/usr/bin/env node
// Clarity diagnosis matrix for the hero black hole (MASTER PROMPT V2 §5). Needs `next dev`.
// Usage: node tests/qa-blackhole-clarity.mjs [baseUrl=http://localhost:3000] [label=v2-diag] [W=2544] [H=1290] [variants=all]
//   A  production page at default quality (warm-up 1/5/20 s: buffer, tier, scale recorded)
//   B  native buffer (QA harness, same camera/time)       C  B without grain / bloom / veil
//   D* C with one filtering stage removed                  E* C with one material change
//   F* C with one volume change                            G  production page again (chosen fix)
// Writes PNG crops (1:1, lossless) of five regions + full frames and metrics.json to
// docs/design-references/noir/black-hole-v2/<label>/.
// Metric "fine" = RMS of (luma − Gaussian σ=2 blur) ÷ mean luma in the crop: a diagnostic for local
// structure, not a quality score (noise raises it too).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const base = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] || "v2-diag";
const W = +(process.argv[4] || 2544);
const H = +(process.argv[5] || 1290);
const only = process.argv[6] ? process.argv[6].split(",") : null;
const OUT = path.join(ROOT, "docs/design-references/noir/black-hole-v2", label);
fs.mkdirSync(OUT, { recursive: true });

const Q = "bhT=12&bhPtr=0";
const QA = `/qa/black-hole?scene=dive&p=0&${Q}`;
const C = `${QA}&bhScale=1&bhGrain=0&bhView=1`;
const variants = {
  A: { url: `/?${Q}`, page: true, note: "production page, default quality after warm-up" },
  B: { url: `${QA}&bhScale=1`, note: "native buffer, same material/post" },
  C: { url: C, note: "native, no grain/bloom/veil" },
  D1: { url: `${C}&bhAbl=1`, note: "C, no fade-to-mean" },
  D2: { url: `${C}&bhAbl=2`, note: "C, no anisotropy bound" },
  D3: { url: `${C}&bhAbl=4`, note: "C, no march-step footprint fold" },
  D4: { url: `${C}&bhAbl=7`, note: "C, all three filtering stages removed" },
  E1: { url: `${C}&bhAbl=8`, note: "C, no inner-edge suppression" },
  E2: { url: `${C}&bhGas=filaments:1`, note: "C, full filament contrast" },
  F1: { url: `${C}&bhGas=thickness:0.008`, note: "C, thinner slab" },
  F2: { url: `${C}&bhGas=opacity:120`, note: "C, higher optical depth" },
  G: { url: `/?${Q}`, page: true, note: "production page with the current code (run after a fix)" },
};
// crop centres as fractions of the viewport (hero p = 0 framing: shadow centre ≈ (0.50, 0.45))
const regions = {
  "upper-arc": [0.5, 0.27],
  junction: [0.4, 0.52],
  "front-band": [0.24, 0.6],
  "lower-arc": [0.5, 0.66],
  "shadow-edge": [0.565, 0.4],
};
const CW = 400, CH = 260;

async function fine(buf) {
  const g = await sharp(buf).greyscale().raw().toBuffer({ resolveWithObject: true });
  const b = await sharp(buf).greyscale().blur(2).raw().toBuffer();
  let m = 0, e = 0;
  for (let i = 0; i < g.data.length; i++) {
    m += g.data[i];
    e += (g.data[i] - b[i]) ** 2;
  }
  m /= g.data.length;
  return { mean: +m.toFixed(1), fine: +(Math.sqrt(e / g.data.length) / Math.max(m, 1)).toFixed(4) };
}

const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const DPR = +(process.env.DPR || 1);
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
const results = {};
for (const [name, v] of Object.entries(variants)) {
  if (only && !only.includes(name)) continue;
  const page = await ctx.newPage();
  await page.goto(base + v.url, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("canvas")?.dataset.ready !== undefined, null, { timeout: 60000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  const samples = [];
  for (const t of v.page ? [1, 5, 20] : [1.2]) {
    const prev = samples.length ? samples[samples.length - 1].t : 0;
    await page.waitForTimeout((t - prev) * 1000);
    samples.push({ t, ...(await page.evaluate(() => { const c = document.querySelector("canvas"); return { buffer: c?.dataset.buffer, tier: c?.dataset.tier, gpuMs: c?.dataset.gpuMs, cssW: Math.round(c.getBoundingClientRect().width), dpr: devicePixelRatio }; })) });
  }
  const full = await page.screenshot({ type: "png" });
  fs.writeFileSync(path.join(OUT, `${name}-full.png`), full);
  const crops = {};
  for (const [rn, [fx, fy]] of Object.entries(regions)) {
    const box = { left: Math.round(fx * W * DPR - CW / 2), top: Math.round(fy * H * DPR - CH / 2), width: CW, height: CH };
    const buf = await sharp(full).extract(box).png().toBuffer();
    fs.writeFileSync(path.join(OUT, `${name}-${rn}.png`), buf);
    crops[rn] = await fine(buf);
  }
  results[name] = { note: v.note, url: v.url, samples, crops };
  console.log(name, JSON.stringify(samples[samples.length - 1]), Object.entries(crops).map(([k, c]) => `${k}:${c.fine}`).join(" "));
  await page.close();
}
await browser.close();
const prev = fs.existsSync(path.join(OUT, "metrics.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "metrics.json"), "utf8")) : {};
fs.writeFileSync(path.join(OUT, "metrics.json"), JSON.stringify({ ...prev, viewport: `${W}x${H}`, camera: "hero p=0", time: 12, ...results }, null, 1));
