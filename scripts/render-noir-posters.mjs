// Renders the fallback posters from NOIR's own WebGL scenes (no third-party imagery).
// Needs `next dev` running (uses the development-only /qa/black-hole harness):
//   node scripts/render-noir-posters.mjs [baseUrl=http://localhost:3000]
// Frozen simulation time (bhT=12), no pointer, high tier, native render scale, DPR 1.5.
import { chromium } from "playwright";
import sharp from "sharp";

const base = process.argv[2] || "http://localhost:3000";
const OUT = "public/sites/noir/media";
const shots = [
  { file: "dive-poster.jpg", query: "scene=dive&p=0" },
  { file: "cinematic-poster.jpg", query: "scene=cinematic&p=0.5" },
];

const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.5 });
const page = await ctx.newPage();
for (const s of shots) {
  await page.goto(`${base}/qa/black-hole?${s.query}&bhT=12&bhPtr=0&bhQ=high&bhScale=1`, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("canvas")?.dataset.ready !== undefined, null, { timeout: 30000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(1200);
  const buf = await page.screenshot({ type: "png" });
  await sharp(buf).resize(1920, 1200).jpeg({ quality: 82, mozjpeg: true }).toFile(`${OUT}/${s.file}`);
  console.log("wrote", `${OUT}/${s.file}`);
}
await browser.close();
