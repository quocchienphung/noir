// JS port of the shader's photon integrator (src/lib/noir/blackhole/shaders.ts, TRACE_FRAG) so the
// numerical scheme can be tested against a converged reference. Units: Schwarzschild radius rs = 1.
// Null geodesics as a central force: x'' = −1.5 h² x / |x|⁵ with h = |x × x'| conserved. This
// reproduces the exact orbit equation u'' + u = 1.5 u² (u = 1/r) of Schwarzschild light rays.

const acc = (p, h2) => {
  const r2 = p[0] * p[0] + p[1] * p[1] + p[2] * p[2];
  const k = (-1.5 * h2) / (r2 * r2 * Math.sqrt(r2));
  return [p[0] * k, p[1] * k, p[2] * k];
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Previous scheme (semi-implicit Euler), kept for the before/after comparison. */
export function traceEuler(p0, v0, { k = 0.065, dmin = 0.012, dmax = 1.4, steps = 220, rEsc = 70 } = {}) {
  let p = [...p0], v = [...v0];
  const hv = cross(p, v), h2 = dot(hv, hv);
  for (let i = 0; i < steps; i++) {
    const r = Math.hypot(...p);
    const dt = Math.min(dmax, Math.max(dmin, k * r));
    const a = acc(p, h2);
    v = [v[0] + a[0] * dt, v[1] + a[1] * dt, v[2] + a[2] * dt];
    p = [p[0] + v[0] * dt, p[1] + v[1] * dt, p[2] + v[2] * dt];
    if (dot(p, p) < 1) return { state: "captured", steps: i + 1, p, v };
    if (r > rEsc && dot(p, v) > 0) return { state: "escaped", steps: i + 1, p, v };
  }
  return { state: "unresolved", steps, p, v };
}

/**
 * Current scheme (mirrors TRACE_FRAG): velocity Verlet (2nd order, one force evaluation per step) with
 * a step that shrinks near the photon sphere, where rays are most sensitive:
 *   dt = clamp(k·r·(0.35 + 0.65·smoothstep(1.5, 4, r)), dmin, dmax)
 */
// steps = the lowest production tier (BlackHoleCanvas TIERS.low), so convergence holds on every tier
export const VERLET = { k: 0.07, dmin: 0.008, dmax: 1.6, steps: 200, rEsc: 60 };
export function stepSize(r, { k, dmin, dmax } = VERLET) {
  const t = Math.min(1, Math.max(0, (r - 1.5) / 2.5));
  const s = t * t * (3 - 2 * t);
  return Math.min(dmax, Math.max(dmin, k * r * (0.35 + 0.65 * s)));
}
export function traceVerlet(p0, v0, opts = VERLET) {
  const o = { ...VERLET, ...opts };
  let p = [...p0], v = [...v0];
  const hv = cross(p, v), h2 = dot(hv, hv);
  let a = acc(p, h2);
  for (let i = 0; i < o.steps; i++) {
    const r = Math.hypot(...p);
    const dt = stepSize(r, o);
    const p1 = [p[0] + v[0] * dt + 0.5 * a[0] * dt * dt, p[1] + v[1] * dt + 0.5 * a[1] * dt * dt, p[2] + v[2] * dt + 0.5 * a[2] * dt * dt];
    const a1 = acc(p1, h2);
    v = [v[0] + 0.5 * (a[0] + a1[0]) * dt, v[1] + 0.5 * (a[1] + a1[1]) * dt, v[2] + 0.5 * (a[2] + a1[2]) * dt];
    p = p1;
    a = a1;
    if (dot(p, p) < 1) return { state: "captured", steps: i + 1, p, v };
    if (r > o.rEsc && dot(p, v) > 0) return { state: "escaped", steps: i + 1, p, v };
  }
  return { state: "unresolved", steps: o.steps, p, v };
}

/** Converged reference: classic RK4 with a tiny step. */
export function traceReference(p0, v0, { h = 0.002, rEsc = 400, maxSteps = 4e6 } = {}) {
  let p = [...p0], v = [...v0];
  const hv = cross(p, v), h2 = dot(hv, hv);
  const f = (p, v) => [v, acc(p, h2)];
  for (let i = 0; i < maxSteps; i++) {
    const r = Math.hypot(...p);
    const dt = Math.max(1e-4, h * r);
    const add = (x, y, s) => [x[0] + y[0] * s, x[1] + y[1] * s, x[2] + y[2] * s];
    const [k1p, k1v] = f(p, v);
    const [k2p, k2v] = f(add(p, k1p, dt / 2), add(v, k1v, dt / 2));
    const [k3p, k3v] = f(add(p, k2p, dt / 2), add(v, k2v, dt / 2));
    const [k4p, k4v] = f(add(p, k3p, dt), add(v, k3v, dt));
    p = [0, 1, 2].map((j) => p[j] + (dt / 6) * (k1p[j] + 2 * k2p[j] + 2 * k3p[j] + k4p[j]));
    v = [0, 1, 2].map((j) => v[j] + (dt / 6) * (k1v[j] + 2 * k2v[j] + 2 * k3v[j] + k4v[j]));
    if (dot(p, p) < 1) return { state: "captured", steps: i + 1, p, v };
    if (r > rEsc && dot(p, v) > 0) return { state: "escaped", steps: i + 1, p, v };
  }
  return { state: "unresolved", steps: maxSteps, p, v };
}

/** Ray from distance d along +z with impact parameter b (offset in x). */
export const rayAt = (b, d) => [[b, 0, -d], [0, 0, 1]];
export const deflection = (res) => (Math.atan2(res.v[0], res.v[2]) * 180) / Math.PI;

/** Critical impact parameter by bisection on capture. */
export function criticalB(trace, d = 20, iters = 40) {
  let lo = 2.0, hi = 3.5;
  for (let i = 0; i < iters; i++) {
    const mid = (lo + hi) / 2;
    const [p, v] = rayAt(mid, d);
    if (trace(p, v).state === "captured") lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
