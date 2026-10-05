#!/usr/bin/env node
// Flow of the *beauty* gas (no markers), measured from top-down frames (needs `next dev`).
// Usage: node tests/qa-blackhole-flow.mjs [baseUrl=http://localhost:3000]
// Frames at t and t+dt are unwrapped to polar (ln r, φ); for each radial band the shift (Δφ, Δln r) that
// best correlates the two is found by search. Reports the visible orbital rate and radial drift per band
// next to the model (Ω = 0.9·r^−1.5 rad/s; inflow 0.014·(2.9/r)^1.5 e-folds/s) and checks:
//   F1 the gas visibly rotates in the model's sense at roughly the model rate (0.6–1.6×)
//   F2 the best radial shift is inward (or zero within resolution) in every band — never outward
import sharp from "sharp";
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:3000";
const S = 900;
const FOV = 34;
const R = 34; // topdown camera height (scenes.ts topdownFrame)
const wpp = (2 * R * Math.tan((FOV * Math.PI) / 360)) / S; // world units per pixel at the disk plane
const failures = [];

const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const page = await (await browser.newContext({ viewport: { width: S, height: S } })).newPage();
async function frame(t) {
  await page.goto(`${base}/qa/black-hole?scene=topdown&bhT=${t}&bhPtr=0&bhQ=high&bhScale=1&bhGrain=0&bhView=1`, { waitUntil: "load" });
  await page.waitForFunction(() => document.querySelector("canvas")?.dataset.ready !== undefined, null, { timeout: 30000 });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(800);
  const { data } = await sharp(await page.screenshot({ type: "png" })).greyscale().raw().toBuffer({ resolveWithObject: true });
  return data;
}
// polar unwrap: NP angles × NR log-radius samples between r0 and r1 (world units)
const NP = 1440, NR = 160;
function unwrap(img, r0, r1) {
  const out = new Float32Array(NP * NR);
  for (let j = 0; j < NR; j++) {
    const r = r0 * Math.pow(r1 / r0, j / (NR - 1));
    for (let i = 0; i < NP; i++) {
      const phi = (i / NP) * Math.PI * 2;
      // topdown: world x → screen right, world z → screen down? sample by the camera basis convention
      const x = S / 2 + (r * Math.cos(phi)) / wpp;
      const y = S / 2 + (r * Math.sin(phi)) / wpp;
      const xi = Math.min(S - 1, Math.max(0, Math.round(x)));
      const yi = Math.min(S - 1, Math.max(0, Math.round(y)));
      out[j * NP + i] = img[yi * S + xi];
    }
  }
  return out;
}
function bestShift(a, b, j0, j1, maxDi, maxDj) {
  let best = { di: 0, dj: 0, c: -Infinity };
  for (let dj = -maxDj; dj <= maxDj; dj++)
    for (let di = -maxDi; di <= maxDi; di++) {
      let sab = 0, saa = 0, sbb = 0, ma = 0, mb = 0, n = 0;
      for (let j = j0; j < j1; j++) {
        const jb = j + dj;
        if (jb < 0 || jb >= NR) continue;
        for (let i = 0; i < NP; i += 2) {
          const ib = (((i + di) % NP) + NP) % NP;
          ma += a[j * NP + i];
          mb += b[jb * NP + ib];
          n++;
        }
      }
      ma /= n; mb /= n;
      for (let j = j0; j < j1; j++) {
        const jb = j + dj;
        if (jb < 0 || jb >= NR) continue;
        for (let i = 0; i < NP; i += 2) {
          const ib = (((i + di) % NP) + NP) % NP;
          const va = a[j * NP + i] - ma, vb = b[jb * NP + ib] - mb;
          sab += va * vb; saa += va * va; sbb += vb * vb;
        }
      }
      const c = sab / Math.sqrt(saa * sbb + 1e-9);
      if (c > best.c) best = { di, dj, c };
    }
  return best;
}

const t0 = 20, dt = 1.5;
const r0 = 3.4, r1 = 13;
const A = unwrap(await frame(t0), r0, r1);
const B = unwrap(await frame(t0 + dt), r0, r1);
await browser.close();
const dlnr = Math.log(r1 / r0) / (NR - 1);
const rows = [];
const bands = [[0, 40], [40, 80], [80, 120], [120, 160]];
for (const [j0, j1] of bands) {
  const rMid = r0 * Math.pow(r1 / r0, (j0 + j1) / 2 / (NR - 1));
  const omega = 0.9 * Math.pow(rMid, -1.5);
  const expectDi = Math.round(((omega * dt) / (Math.PI * 2)) * NP);
  const b = bestShift(A, B, j0, j1, Math.max(12, expectDi * 3), 6);
  const omegaMeas = ((b.di / NP) * Math.PI * 2) / dt; // signed, screen sense
  const dlnrMeas = (b.dj * dlnr) / dt;
  const drift = 0.014 * Math.pow(2.9 / rMid, 1.5);
  rows.push({ r: +rMid.toFixed(2), omegaModel: +omega.toFixed(4), omegaMeas: +omegaMeas.toFixed(4), dlnrModel: -drift, dlnrMeas: +dlnrMeas.toFixed(5), resolution: +(dlnr / dt).toFixed(5), corr: +b.c.toFixed(3) });
}
console.log(JSON.stringify(rows, null, 1));
for (const row of rows) {
  const ratio = Math.abs(row.omegaMeas) / row.omegaModel;
  if (!(ratio > 0.6 && ratio < 1.6)) failures.push(`F1 r=${row.r}: visible rotation ${row.omegaMeas} rad/s vs model ${row.omegaModel}`);
  if (row.dlnrMeas > row.resolution * 0.5) failures.push(`F2 r=${row.r}: gas drifts outward (${row.dlnrMeas} /s)`);
}
const senses = new Set(rows.map((r) => Math.sign(r.omegaMeas)));
if (senses.size > 1) failures.push(`F1 bands rotate in different senses: ${rows.map((r) => r.omegaMeas).join(", ")}`);
if (failures.length) {
  console.log(`FAIL (${failures.length})\n` + failures.join("\n"));
  process.exit(1);
}
console.log("PASS");
