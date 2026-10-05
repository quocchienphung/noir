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
  };
}

/**
 * Cinematic study after the Gargantua reference (camera path unchanged from the accepted version): a
 * tilted, nearly edge-on view; framed, the hole sits centred behind the NOIR mark, and as the frame
 * opens the aim drifts so the hole settles right of centre. Left side approaching (negative orbit).
 */
export function cinematicFrame(input: SceneInput): FrameParams {
  const q = clamp01(input.progress);
  const d = lerp(21, 15.5, smooth(0.0, 0.9, q));
  const elev = (2.4 + input.pointer.y * 0.8) * DEG;
  const az = (-8 + input.pointer.x * 2.0 + Math.sin(input.time * 0.03) * 1.2) * DEG;
  const eye = orbitCam(d, elev, az);
  const roll = -17 * DEG;
  const basis0 = lookAt(eye, [0, 0, 0], roll);
  const open = smooth(0.06, 0.42, q);
  const shift = (input.aspect > 1.2 ? 0.18 : 0.04) * d * open;
  const target: Vec3 = [-basis0[0] * shift, -basis0[1] * shift + 0.8, -basis0[2] * shift];
  const fov = lerp(42, 38, q) * DEG;
  return {
    camPos: eye,
    basis: lookAt(eye, target, roll),
    tanHalfFov: Math.tan(fov / 2),
    time: input.time,
    quality: input.quality,
    gas: { ...GAS, orbit: -GAS.orbit, doppler: 0.45 },
    exposure: 1.0,
    bloomGain: 0.55,
    bloomThreshold: 0.9,
    fade: 0,
    grain: 0.03,
    hueKeep: 0.15,
    veil: 1.2,
    starGain: 0.8,
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
