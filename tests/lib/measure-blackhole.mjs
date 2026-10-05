// Feature measurement for a black-hole frame (reference video still or renderer capture).
//
// measure(file, { seed: [x, y] fraction of w/h inside the shadow, crop })
//  shadow    least-squares circle through the shadow boundary found by radial edge detection: from a
//            centre estimate, rays march outward and stop at the first sharp rise above the running
//            interior minimum (the photon-ring edge). Hazy shadows (the video lifts its interior to
//            L≈30–60) defeat plain thresholds; this does not. Iterated with outlier rejection, which
//            also drops rays stopped early by the foreground disk band.
//            Only rays inside `fitAngles` (image degrees, 270 = up) are used.
//  band      angle of the band's upper edge where it crosses the shadow (positive = rising to the right)
//  highlight centroid of the brightest 2 % of pixels
//  stats     mean luma and the near-black fraction (L < 20)
// Pixels are measured on the luminance of the (optionally cropped) image; fractions are of width/height.
import sharp from "sharp";

function fitCircle(P) {
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, sxz = 0, syz = 0, sz = 0;
  for (const [x, y] of P) {
    const z = x * x + y * y;
    sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y; sxz += x * z; syz += y * z; sz += z;
  }
  const A = [
    [sxx, sxy, sx, sxz],
    [sxy, syy, sy, syz],
    [sx, sy, P.length, sz],
  ];
  for (let c = 0; c < 3; c++) {
    let p = c;
    for (let r = c + 1; r < 3; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < 3; r++)
      if (r !== c) {
        const f = A[r][c] / A[c][c];
        for (let k = c; k < 4; k++) A[r][k] -= f * A[c][k];
      }
  }
  const cx = A[0][3] / A[0][0] / 2;
  const cy = A[1][3] / A[1][1] / 2;
  return { cx, cy, r: Math.sqrt(A[2][3] / A[2][2] + cx * cx + cy * cy) };
}

export async function measure(file, { seed = [0.86, 0.33], crop, fitAngles = [175, 365] } = {}) {
  let img = sharp(file).removeAlpha();
  if (crop) img = img.extract(crop);
  const { data, info } = await img.greyscale().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const L = (x, y) => data[y * W + x];

  let cx = seed[0] * W;
  let cy = seed[1] * H;
  let circle = null;
  let pts = [];
  for (let iter = 0; iter < 5; iter++) {
    pts = [];
    // image-space degrees (y down: 270 = straight up); the default window keeps the upper and side arcs
    // and skips the lower half, where the foreground band crosses the shadow
    for (let a = fitAngles[0]; a < fitAngles[1]; a += 1) {
      const dx = Math.cos((a * Math.PI) / 180);
      const dy = Math.sin((a * Math.PI) / 180);
      let runMin = 255;
      for (let r = 6; r < H * 1.5; r++) {
        const x = Math.round(cx + dx * r);
        const y = Math.round(cy + dy * r);
        if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2) break;
        const v = L(x, y);
        runMin = Math.min(runMin, v);
        // stop at the first genuinely bright ring/disk pixel, then backtrack to the steepest rise: the
        // interior haze ramps up gradually and must not be mistaken for the edge
        if (r > 15 && v > Math.max(165, runMin * 3 + 60)) {
          let best = r;
          let bestG = -1;
          for (let q = r; q > Math.max(8, r - 40); q--) {
            const xa = Math.round(cx + dx * q), ya = Math.round(cy + dy * q);
            const xb = Math.round(cx + dx * (q - 3)), yb = Math.round(cy + dy * (q - 3));
            const g = L(xa, ya) - L(xb, yb);
            if (g > bestG) {
              bestG = g;
              best = q;
            }
          }
          pts.push([Math.round(cx + dx * best), Math.round(cy + dy * best)]);
          break;
        }
      }
    }
    if (pts.length < 20) break;
    let c = fitCircle(pts);
    let inl = pts;
    for (let k = 0; k < 4; k++) {
      const res = inl.map(([x, y]) => Math.abs(Math.hypot(x - c.cx, y - c.cy) - c.r));
      // keep the outermost consistent set: points stopped early (band in front) lie well inside
      const sorted = [...res].sort((a, b) => a - b);
      const tol = Math.max(2.5, sorted[Math.floor(sorted.length * 0.55)] * 1.6);
      const next = inl.filter((_, i) => res[i] <= tol);
      if (next.length < 20) break;
      inl = next;
      c = fitCircle(inl);
    }
    circle = { ...c, inliers: inl.length };
    cx = c.cx;
    cy = c.cy;
  }

  // band upper edge where it crosses the shadow: first bright pixel scanning down inside the circle
  const edge = [];
  if (circle) {
    const x0 = Math.max(3, Math.round(circle.cx - circle.r * 0.85));
    const x1 = Math.min(W - 3, Math.round(circle.cx + circle.r * 0.85));
    for (let x = x0; x < x1; x += 2) {
      const yTop = Math.round(circle.cy - Math.sqrt(Math.max(0, circle.r ** 2 - (x - circle.cx) ** 2)) * 0.6);
      let runMin = 255;
      for (let y = Math.max(2, yTop); y < Math.min(H - 2, circle.cy + circle.r * 0.95); y++) {
        const v = L(x, y);
        runMin = Math.min(runMin, v);
        if (v > Math.max(90, runMin * 2.6 + 35)) {
          edge.push([x, y]);
          break;
        }
      }
    }
  }
  let angle = null;
  if (edge.length > 8) {
    // robust line: fit, drop the worst 30 %, refit
    const lineFit = (E) => {
      const n = E.length;
      const mx = E.reduce((s, p) => s + p[0], 0) / n;
      const my = E.reduce((s, p) => s + p[1], 0) / n;
      const k = E.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / E.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
      return { k, b: my - k * mx };
    };
    let lf = lineFit(edge);
    const res = edge.map(([x, y]) => Math.abs(y - (lf.k * x + lf.b)));
    const lim = [...res].sort((a, b) => a - b)[Math.floor(res.length * 0.7)];
    lf = lineFit(edge.filter((_, i) => res[i] <= lim));
    angle = (Math.atan(-lf.k) * 180) / Math.PI;
  }

  const hist = new Array(256).fill(0);
  for (let i = 0; i < data.length; i++) hist[data[i]]++;
  let acc = 0;
  let thr = 255;
  for (let v = 255; v >= 0; v--) {
    acc += hist[v];
    if (acc > data.length * 0.02) {
      thr = v;
      break;
    }
  }
  let bx = 0, by = 0, bn = 0, mean = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const v = L(x, y);
      mean += v;
      if (v >= thr) {
        bx += x;
        by += y;
        bn++;
      }
    }
  mean /= data.length;
  const interior = [];
  if (circle) for (let i = 0; i < 400; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * circle.r * 0.6;
    const x = Math.round(circle.cx + Math.cos(a) * r), y = Math.round(circle.cy + Math.sin(a) * r);
    if (x >= 0 && y >= 0 && x < W && y < H) interior.push(L(x, y));
  }
  interior.sort((a, b) => a - b);
  return {
    size: [W, H],
    shadow: circle && {
      cx: +circle.cx.toFixed(1),
      cy: +circle.cy.toFixed(1),
      r: +circle.r.toFixed(1),
      cxF: +(circle.cx / W).toFixed(4),
      cyF: +(circle.cy / H).toFixed(4),
      rH: +(circle.r / H).toFixed(4),
      rays: pts.length,
      inliers: circle.inliers,
      interiorMedianLuma: interior.length ? interior[interior.length >> 1] : null,
    },
    bandAngleDeg: angle === null ? null : +angle.toFixed(2),
    bandEdgePts: edge.length,
    highlight: { x: +(bx / bn / W).toFixed(3), y: +(by / bn / H).toFixed(3), threshold: thr },
    meanLuma: +mean.toFixed(1),
    nearBlackFraction: +(hist.slice(0, 20).reduce((a, b) => a + b, 0) / data.length).toFixed(3),
  };
}
