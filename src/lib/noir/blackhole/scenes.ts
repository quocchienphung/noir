import { HERO_ENVIRONMENT } from "./environment";
import { lookAt, type FrameParams, type GasLook, type Quality } from "./renderer";

type Vec3 = [number, number, number];

/** Normalised pointer position, −1…1 on both axes (0 = centre). */
export interface Pointer {
  x: number;
  y: number;
}

export interface SceneInput {
  /** Smoothed timeline progress 0…1 (scroll). Drives the camera only. */
  progress: number;
  pointer: Pointer;
  /** Simulation time, s. Drives the gas only. */
  time: number;
  aspect: number;
  quality: Quality;
}

const DEG = Math.PI / 180;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The one accretion-flow material, art-directed against the Gargantua reference
 * (docs/research/noir/BLACK_HOLE_REBUILD.md): white-hot inner gas with champagne → copper → umber
 * outskirts, clumped masses and voids, meandering filaments, Keplerian shear with a slow inflow that
 * speeds up into plunging streams inside the inner edge. Linear-RGB palette.
 */
export const GAS: GasLook = {
  inner: 2.9,
  outer: 16,
  thickness: 0.016,
  gain: 42,
  falloff: 1.65,
  opacity: 30,
  doppler: 0.35,
  orbit: 0.9,
  drift: 0.014,
  warp: 1.0,
  filaments: 1,
  clumping: 0.6,
  plunge: 0.38,
  period: 28,
  heat: 1.15,
  palette: [
    [1.0, 0.95, 0.9],
    [0.95, 0.72, 0.5],
    [0.66, 0.32, 0.12],
    [0.22, 0.095, 0.035],
  ],
};

/** Gauge value shown next to the dive: r = 20^(1 − p) rs (MEASURED on the reference intro). */
export const horizonDistance = (p: number) => Math.pow(20, 1 - clamp01(p));

const orbitCam = (d: number, elev: number, az: number): Vec3 => [d * Math.cos(elev) * Math.sin(az), d * Math.sin(elev), -d * Math.cos(elev) * Math.cos(az)];

/**
 * Scroll-driven dive (camera path unchanged from the accepted version). p = 0: hole framed at r = 20 rs,
 * camera 6.5° above the disk plane. Approaching, the view pitches up and rolls so the disk sinks
 * diagonally out of frame; past the photon sphere the shadow fills the screen and the image fades to
 * black as r → 1.
 */
export function diveFrame(input: SceneInput): FrameParams {
  const p = clamp01(input.progress);
  const r = horizonDistance(p);
  const d = Math.max(r, 1.04);
  const near = smooth(0.18, 0.82, p);

  const elev = (6.5 - 2.6 * near + input.pointer.y * 1.6 * (1 - p)) * DEG;
  const az = (input.pointer.x * 4.0 * (1 - 0.7 * p) + Math.sin(input.time * 0.05) * 0.6) * DEG;
  const eye = orbitCam(d, elev, az);
  const pitchUp = (14 * near + 10 * smooth(0.6, 0.95, p)) * DEG;
  const target: Vec3 = [0, Math.tan(pitchUp) * d, 0];
  const roll = (-2.5 - 11 * near) * DEG;
  const fov = lerp(52, 64, smooth(0.25, 0.95, p)) * DEG;

  return {
    camPos: eye,
    basis: lookAt(eye, target, roll),
    tanHalfFov: Math.tan(fov / 2),
    time: input.time,
    quality: input.quality,
    gas: { ...GAS, outer: 17, falloff: 1.45 },
    exposure: 1.85,
    bloomGain: 0.32,
    bloomThreshold: 1.1,
    fade: smooth(0.84, 0.985, p),
    grain: 0.035,
    hueKeep: 0.18,
    veil: 0.6,
    starGain: 1,
    // additive: lensed background environment (environment.ts); every value above is the accepted look
    environment: HERO_ENVIRONMENT,
  };
}

/** One cinematic camera key: distance (rs), elevation/azimuth/roll/fov (degrees) and aim offsets. */
interface CineKey {
  q: number;
  d: number;
  elev: number;
  az: number;
  roll: number;
  fov: number;
  /** Screen x of the hole's centre (0 left … 1 right), independent of the aspect ratio. */
  hx: number;
  /** Aim height above the hole (rs): the hole moves down on screen. */
  ty: number;
}

/**
 * Cinematic-only camera path (prompt/03_CINEMATIC_CLOSEUP.md), keyed on the cinematic timeline q
 * (framedEnd 0.06, expandedAt 0.42, statementEnd 0.82). Keys are joined by quintic eases, so velocity is
 * continuous (and zero) at every key, reverse scroll retraces the same path and nothing jumps at 0.42.
 *   framed      q 0–0.06   the accepted framed pose: hole centred behind the NOIR mark
 *   approach    → 0.27     dolly in low over the band to where it meets the lensed arc (the clip's 5–9 s
 *                          close shot, re-composed: shadow kept on the right, near band as foreground)
 *   settle      → 0.42     ease back out to the statement framing; speed falls to zero before the copy
 *   statement   → 0.82     shadow right (centre ≈ 0.75 W), radius ≈ 0.3 H, band rising to the right; a slow
 *                          push-in only
 *   exit        → 1        the push continues into Services
 * Initial fit by eye and measurement (tests/qa-spacetime-cinefit.mjs), not camera data from the clip.
 */
export const CINEMATIC_KEYS: { wide: readonly CineKey[]; narrow: readonly CineKey[] } = {
  wide: [
    { q: 0, d: 21, elev: 2.4, az: -8, roll: -17, fov: 42, hx: 0.5, ty: 0.8 },
    { q: 0.06, d: 20.8, elev: 2.4, az: -8, roll: -17, fov: 42, hx: 0.5, ty: 0.8 },
    { q: 0.27, d: 9.6, elev: 1.55, az: -15, roll: -15, fov: 34, hx: 0.76, ty: 0.15 },
    { q: 0.42, d: 12.2, elev: 2.1, az: -9, roll: -17, fov: 36, hx: 0.75, ty: 0.55 },
    { q: 0.82, d: 11.4, elev: 2.05, az: -9.5, roll: -17, fov: 36, hx: 0.755, ty: 0.55 },
    { q: 1, d: 10.9, elev: 2.0, az: -10, roll: -17, fov: 36, hx: 0.76, ty: 0.55 },
  ],
  // phones: the copy sits in the lower part of the frame, so the hole stays centred and high
  narrow: [
    { q: 0, d: 21, elev: 2.4, az: -8, roll: -17, fov: 42, hx: 0.5, ty: 0.8 },
    { q: 0.06, d: 20.8, elev: 2.4, az: -8, roll: -17, fov: 42, hx: 0.5, ty: 0.8 },
    { q: 0.27, d: 11, elev: 1.7, az: -13, roll: -15, fov: 40, hx: 0.6, ty: -0.4 },
    { q: 0.42, d: 14.5, elev: 2.2, az: -9, roll: -17, fov: 40, hx: 0.56, ty: -1.2 },
    { q: 0.82, d: 13.8, elev: 2.2, az: -9.5, roll: -17, fov: 40, hx: 0.56, ty: -1.2 },
    { q: 1, d: 13.3, elev: 2.1, az: -10, roll: -17, fov: 40, hx: 0.56, ty: -1.2 },
  ],
};

/**
 * Cinematic-only look: the glare reduction of prompt/03 §E lives here and nowhere else. `GAS`, the hero's
 * look values and the shared tone map are untouched (tests/qa-spacetime-independence.mjs). Typed and frozen,
 * so no frame can mutate a shared object. Values are the tuned result of the measured passes recorded in
 * SPACETIME_IMPLEMENTATION.md (previous values: exposure 1.0, bloomGain 0.55, threshold 0.9, veil 1.2).
 */
export const CINEMATIC_LOOK = Object.freeze({
  exposure: 0.8,
  bloomGain: 0.22,
  bloomThreshold: 1.5,
  veil: 0.3,
  grain: 0.03,
  hueKeep: 0.15,
  starGain: 0.8,
  gas: Object.freeze({ orbit: -GAS.orbit, doppler: 0.45 }),
});

const ease5 = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
function cineKey(keys: readonly CineKey[], q: number): CineKey {
  let i = 0;
  while (i < keys.length - 2 && q > keys[i + 1].q) i++;
  const a = keys[i], b = keys[i + 1];
  const t = ease5(clamp01((q - a.q) / (b.q - a.q)));
  return {
    q,
    d: lerp(a.d, b.d, t),
    elev: lerp(a.elev, b.elev, t),
    az: lerp(a.az, b.az, t),
    roll: lerp(a.roll, b.roll, t),
    fov: lerp(a.fov, b.fov, t),
    hx: lerp(a.hx, b.hx, t),
    ty: lerp(a.ty, b.ty, t),
  };
}

/**
 * Cinematic study ("Event horizon / Complexity / pulled into / a single orbit."): a tilted, nearly
 * edge-on view with its own camera path and look (above). Left side approaching (negative orbit).
 * Pointer parallax and a slow sway are kept from the accepted version.
 */
export function cinematicFrame(input: SceneInput): FrameParams {
  const q = clamp01(input.progress);
  const k = cineKey(input.aspect > 1.2 ? CINEMATIC_KEYS.wide : CINEMATIC_KEYS.narrow, q);
  // parallax shrinks as the camera gets close, so the close shot never swims
  const near = clamp01((21 - k.d) / 11);
  const elev = (k.elev + input.pointer.y * 0.8 * (1 - 0.6 * near)) * DEG;
  const az = (k.az + input.pointer.x * 2.0 * (1 - 0.6 * near) + Math.sin(input.time * 0.03) * 1.2 * (1 - 0.5 * near)) * DEG;
  const eye = orbitCam(k.d, elev, az);
  const roll = k.roll * DEG;
  const basis0 = lookAt(eye, [0, 0, 0], roll);
  // turning the aim by s/d (tan space) moves the hole by s/d ÷ (tan½fov · aspect) in NDC
  const tanHalf = Math.tan((k.fov * DEG) / 2);
  const shift = (2 * k.hx - 1) * tanHalf * input.aspect * k.d;
  const target: Vec3 = [-basis0[0] * shift, -basis0[1] * shift + k.ty, -basis0[2] * shift];
  const L = CINEMATIC_LOOK;
  return {
    camPos: eye,
    basis: lookAt(eye, target, roll),
    tanHalfFov: tanHalf,
    time: input.time,
    quality: input.quality,
    gas: { ...GAS, ...L.gas },
    exposure: L.exposure,
    bloomGain: L.bloomGain,
    bloomThreshold: L.bloomThreshold,
    fade: 0,
    grain: L.grain,
    hueKeep: L.hueKeep,
    veil: L.veil,
    starGain: L.starGain,
  };
}

/**
 * Development-only QA camera matched to the reference video's framing (shadow centre ≈ (0.88 W,
 * 0.34 H), radius ≈ 0.31 H on 16:9, band rising ≈ 20° to the right). Never used on the site.
 * Parameters are fitted with tests/qa-blackhole-reference.mjs.
 */
export const REFERENCE_CAMERA = { distance: 28.9, elevation: 2.6, fov: 18, yaw: 12.14, pitch: 3.3, roll: -20.5 };

export function referenceFrame(input: SceneInput): FrameParams {
  const c = REFERENCE_CAMERA;
  const eye = orbitCam(c.distance, c.elevation * DEG, -8 * DEG);
  // look at the hole, then turn the view so the hole lands up-right of centre
  const base = lookAt(eye, [0, 0, 0], c.roll * DEG);
  const right: Vec3 = [base[0], base[1], base[2]];
  const up: Vec3 = [base[3], base[4], base[5]];
  const fwd: Vec3 = [base[6], base[7], base[8]];
  const ty = Math.tan(c.yaw * DEG);
  const tp = Math.tan(c.pitch * DEG);
  // new forward = forward − right·tan(yaw) − up·tan(pitch) → the hole appears right/up of centre
  const nf: Vec3 = [fwd[0] - right[0] * ty - up[0] * tp, fwd[1] - right[1] * ty - up[1] * tp, fwd[2] - right[2] * ty - up[2] * tp];
  const target: Vec3 = [eye[0] + nf[0], eye[1] + nf[1], eye[2] + nf[2]];
  return {
    camPos: eye,
    basis: lookAt(eye, target, c.roll * DEG),
    tanHalfFov: Math.tan((c.fov * DEG) / 2),
    time: input.time,
    quality: input.quality,
    gas: { ...GAS, orbit: -GAS.orbit, doppler: 0.45 },
    exposure: 1.0,
    bloomGain: 0.55,
    bloomThreshold: 0.6,
    fade: 0,
    grain: 0.03,
    hueKeep: 0.15,
    veil: 0.4,
    starGain: 0.8,
  };
}

/** Development-only QA camera straight above the hole (for measuring orbital and inflow motion). */
export function topdownFrame(input: SceneInput): FrameParams {
  const eye: Vec3 = [0, 34, 0.0001];
  return {
    camPos: eye,
    basis: lookAt(eye, [0, 0, 0], 0),
    tanHalfFov: Math.tan((34 * DEG) / 2),
    time: input.time,
    quality: input.quality,
    gas: { ...GAS },
    exposure: 1.0,
    bloomGain: 0.2,
    bloomThreshold: 1.2,
    fade: 0,
    grain: 0,
    hueKeep: 0.15,
    veil: 0,
    starGain: 0,
  };
}
