// Tracks the debug flow markers (bhDebug=3, green knots fixed in the flow's co-moving frame) between two
// top-down frames and reports their measured angular and radial velocity against the flow model.
// node tests/lib/track-markers.mjs <frameA.png> <frameB.png> <dtSeconds> <worldPerPixel> <orbit> <drift> <inner>
import sharp from "sharp";

const [fa, fb, dtS, wppS, orbitS, driftS, innerS] = process.argv.slice(2);
const dt = +dtS, wpp = +wppS, orbit = +orbitS, drift = +driftS, inner = +innerS;

async function blobs(file) {
  const { data, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const green = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) green[i] = data[i * 3 + 1] - Math.max(data[i * 3], data[i * 3 + 2]) > 30 ? 1 : 0;
  const seen = new Uint8Array(W * H);
  const out = [];
  for (let i = 0; i < W * H; i++) {
    if (!green[i] || seen[i]) continue;
    const st = [i];
    seen[i] = 1;
    let sx = 0, sy = 0, n = 0;
    while (st.length) {
      const j = st.pop();
      const x = j % W, y = (j / W) | 0;
      sx += x; sy += y; n++;
      for (const k of [j - 1, j + 1, j - W, j + W]) if (k >= 0 && k < W * H && green[k] && !seen[k]) { seen[k] = 1; st.push(k); }
    }
    if (n >= 6) out.push({ x: sx / n - W / 2, y: sy / n - H / 2, n });
  }
  return out;
}
const A = await blobs(fa), B = await blobs(fb);
const rows = [];
for (const a of A) {
  let best = null, bd = 1e9;
  for (const b of B) { const d = Math.hypot(b.x - a.x, b.y - a.y); if (d < bd) { bd = d; best = b; } }
  if (!best || bd > 40) continue;
  const ra = Math.hypot(a.x, a.y), rb = Math.hypot(best.x, best.y);
  if (ra * wpp < inner * 1.15) continue; // skip the lensed region at the shadow edge
  let dphi = Math.atan2(best.y, best.x) - Math.atan2(a.y, a.x);
  if (dphi > Math.PI) dphi -= 2 * Math.PI;
  if (dphi < -Math.PI) dphi += 2 * Math.PI;
  const r = ra * wpp;
  const omegaModel = orbit * Math.pow(r, -1.5);
  const vsModel = drift * Math.pow(inner / r, 1.5); // e-folds of radius per second
  rows.push({ r: +r.toFixed(2), omegaMeas: Math.abs(dphi) / dt, omegaModel, dlnrMeas: Math.log(rb / ra) / dt, dlnrModel: -vsModel });
}
rows.sort((a, b) => a.r - b.r);
const avg = (k) => rows.reduce((s, x) => s + x[k], 0) / rows.length;
console.log(JSON.stringify({ tracked: rows.length, omegaMeasOverModel: +(avg("omegaMeas") / avg("omegaModel")).toFixed(3), dlnrMeasMean: +avg("dlnrMeas").toFixed(5), dlnrModelMean: +avg("dlnrModel").toFixed(5), inwardFraction: +(rows.filter((x) => x.dlnrMeas < 0).length / rows.length).toFixed(2), sample: rows.filter((_, i) => i % Math.max(1, Math.floor(rows.length / 6)) === 0).map((x) => ({ r: x.r, w: +x.omegaMeas.toFixed(4), wModel: +x.omegaModel.toFixed(4), dlnr: +x.dlnrMeas.toFixed(4), dlnrModel: +x.dlnrModel.toFixed(4) })) }, null, 1));
