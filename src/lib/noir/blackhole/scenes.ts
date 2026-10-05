import { lookAt, type DiskLook, type FrameParams } from "./renderer";

/** Normalised pointer position, −1…1 on both axes (0 = centre). */
export interface Pointer {
  x: number;
  y: number;
}

export interface SceneInput {
  /** Smoothed timeline progress 0…1. */
  progress: number;
  pointer: Pointer;
  time: number;
  aspect: number;
  steps: number;
}

const DEG = Math.PI / 180;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Warm Eventide-like disk: gold-white inner edge, amber body, umber outskirts. */
export const DIVE_DISK: DiskLook = {
  inner: 2.75,
  outer: 17,
  gain: 2.3,
  doppler: 0.42,
  flow: 1.25,
  hot: [1.0, 0.7, 0.34],
  warm: [1.0, 0.38, 0.05],
  cool: [0.6, 0.1, 0.015],
};

/** Gargantua-like disk: near-white core, cream, toasted-brown streaks; stronger beaming on the approaching side. */
export const CINEMATIC_DISK: DiskLook = {
  inner: 2.9,
  outer: 15,
  gain: 2.1,
  doppler: 0.95,
  flow: -0.8,
  hot: [1.0, 0.93, 0.84],
  warm: [1.0, 0.6, 0.27],
  cool: [0.5, 0.17, 0.045],
};

/** Gauge value shown next to the dive: r = 20^(1 − p) rs (MEASURED on the reference intro). */
export const horizonDistance = (p: number) => Math.pow(20, 1 - clamp01(p));

/**
 * Scroll-driven dive. p = 0: hole framed at r = 20 rs, camera 6.5° above the disk plane.
 * Approaching, the view pitches up and rolls so the disk sinks diagonally out of frame; past the photon
 * sphere the shadow fills the screen and the image fades to black as r → 1 (the horizon).
 */
export function diveFrame(input: SceneInput): FrameParams {
  const p = clamp01(input.progress);
  const r = horizonDistance(p);
  const d = Math.max(r, 1.04);
  const near = smooth(0.18, 0.82, p);

  const elev = (6.5 - 2.6 * near + input.pointer.y * 1.6 * (1 - p)) * DEG;
  const az = (input.pointer.x * 4.0 * (1 - 0.7 * p) + Math.sin(input.time * 0.05) * 0.6) * DEG;
  const eye: [number, number, number] = [d * Math.cos(elev) * Math.sin(az), d * Math.sin(elev), -d * Math.cos(elev) * Math.cos(az)];

  // look slightly above the centre as we close in, so the disk band drops toward the lower edge
  const pitchUp = (14 * near + 10 * smooth(0.6, 0.95, p)) * DEG;
  const target: [number, number, number] = [0, Math.tan(pitchUp) * d, 0];
  const roll = (-2.5 - 11 * near) * DEG;
  const fov = lerp(52, 64, smooth(0.25, 0.95, p)) * DEG;

  return {
    camPos: eye,
    basis: lookAt(eye, target, roll),
    tanHalfFov: Math.tan(fov / 2),
    time: input.time,
    steps: input.steps,
    disk: DIVE_DISK,
    exposure: 1.0,
    bloomGain: 0.4,
    bloomThreshold: 0.8,
    fade: smooth(0.84, 0.985, p),
    grain: 0.035,
    starGain: 1,
  };
}

/**
 * Cinematic study after the Gargantua reference: a tilted, nearly edge-on view with the hole right of centre,
 * the disk crossing from lower left; time-driven flow, a slow push-in driven by section progress.
 */
export function cinematicFrame(input: SceneInput): FrameParams {
  const q = clamp01(input.progress);
  const d = lerp(21, 15.5, smooth(0.0, 0.9, q));
  const elev = (2.4 + input.pointer.y * 0.8) * DEG;
  const az = (-8 + input.pointer.x * 2.0 + Math.sin(input.time * 0.03) * 1.2) * DEG;
  const eye: [number, number, number] = [d * Math.cos(elev) * Math.sin(az), d * Math.sin(elev), -d * Math.cos(elev) * Math.cos(az)];
  const roll = -17 * DEG;
  const basis0 = lookAt(eye, [0, 0, 0], roll);
  // framed: hole centred behind the NOIR mark; as the frame opens the aim drifts left (along −right) so
  // the hole settles right of centre on wide screens, like the reference composition
  const open = smooth(0.06, 0.42, q);
  const shift = (input.aspect > 1.2 ? 0.18 : 0.04) * d * open;
  const target: [number, number, number] = [-basis0[0] * shift, -basis0[1] * shift + 0.8, -basis0[2] * shift];
  const fov = lerp(42, 38, q) * DEG;
  return {
    camPos: eye,
    basis: lookAt(eye, target, roll),
    tanHalfFov: Math.tan(fov / 2),
    time: input.time,
    steps: input.steps,
    disk: CINEMATIC_DISK,
    exposure: 1.0,
    bloomGain: 0.3,
    bloomThreshold: 1.0,
    fade: 0,
    grain: 0.03,
    starGain: 0.8,
  };
}
