// Background environment for the ray-traced black hole (prompt/02_HERO_ENVIRONMENT_LENSING.md).
//
// The environment is radiance at infinity, looked up with the direction each ray has when it escapes. It
// is never drawn in screen space: arcs, multiple images and Einstein rings come only from the same
// geodesics that already bend the disk. Captured rays never see it, and it is added through the ray's
// remaining transmittance before any post-processing. Everything is procedural and seeded; no frame of a
// reference clip is used.

type Vec3 = [number, number, number];

/** One extended background source (a small galaxy-like patch) at infinity. */
export interface EnvSource {
  /** Unit direction (world space) from the hole towards the source. */
  direction: Vec3;
  /** Angular half-size of the patch, radians (Gaussian σ of the major axis). */
  angularSize: number;
  /** Minor ÷ major axis of the patch, 0.2–1. */
  aspect: number;
  /** Peak radiance, linear RGB (scene units before exposure). */
  radiance: Vec3;
}

export interface EnvironmentLook {
  /** false → the renderer uses the accepted pre-environment star background, bit for bit. */
  enabled: boolean;
  /** Overall gain of the environment (stars, sources and diffuse band). */
  intensity: number;
  /** Seed of the star/band noise (integer-valued). */
  seed: number;
  /** Up to three extended sources. */
  sources: EnvSource[];
  /** Gain of the dense faint star layers (the base star layer is always kept). */
  stars: number;
  /** Gain of the faint diffuse band (a dim great-circle glow, linear radiance). */
  diffuse: number;
  /** Normal of the band's great circle (world space). */
  bandNormal: Vec3;
  /** Rotation of the whole environment about world +Y, radians. */
  ambientMapRotation: number;
  /** Extra rotation per simulation second (rad/s). 0 on the site: camera and sources hold still. */
  animationRate: number;
}

const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/**
 * World direction that sits `offset` radians from the line of sight camera → hole, at screen angle `angle`
 * (0 = screen right, 90° = screen up) as seen from a camera at `eye` looking at the hole with no roll.
 * Used to place sources relative to the hero's opening view; the result is a fixed world direction.
 */
export function directionNearLineOfSight(eye: Vec3, offset: number, angleDeg: number): Vec3 {
  const f = norm([-eye[0], -eye[1], -eye[2]]);
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const a = (angleDeg * Math.PI) / 180;
  const t = Math.tan(offset);
  return norm([
    f[0] + t * (Math.cos(a) * r[0] + Math.sin(a) * u[0]),
    f[1] + t * (Math.cos(a) * r[1] + Math.sin(a) * u[1]),
    f[2] + t * (Math.cos(a) * r[2] + Math.sin(a) * u[2]),
  ]);
}

/** Hero opening camera (diveFrame at p = 0, no pointer, no sway): r = 20 rs, 6.5° above the disk plane. */
const HERO_EYE: Vec3 = [0, 20 * Math.sin((6.5 * Math.PI) / 180), -20 * Math.cos((6.5 * Math.PI) / 180)];

/**
 * Hero environment (proposed art direction, tuned on captures; see SPACETIME_IMPLEMENTATION.md).
 * The main source sits 0.12 rad off the hero's line of sight towards the right, so its primary image
 * is a visible arc just outside the Einstein radius (≈ √(2/20) rad from r = 20 rs) above the disk, and its
 * counter-image falls behind the disk band, as lensing predicts. Exploring the 360° view changes the
 * alignment, so the arc grows, splits or closes into a ring at the viewpoints where geometry says it should.
 */
export const HERO_ENVIRONMENT: EnvironmentLook = {
  enabled: true,
  intensity: 1,
  seed: 7,
  sources: [
    { direction: directionNearLineOfSight(HERO_EYE, 0.12, 20), angularSize: 0.022, aspect: 0.62, radiance: [0.25, 0.215, 0.17] },
    { direction: directionNearLineOfSight(HERO_EYE, 0.95, 160), angularSize: 0.018, aspect: 0.8, radiance: [0.2, 0.17, 0.14] },
    { direction: norm([0.55, 0.35, 0.76]), angularSize: 0.022, aspect: 0.5, radiance: [0.16, 0.12, 0.09] },
  ],
  stars: 1,
  diffuse: 0.018,
  bandNormal: norm([0.35, 0.82, -0.45]),
  ambientMapRotation: 0,
  animationRate: 0,
};

/**
 * QA only: moves `source` along a great circle through exact alignment with `eye` → hole over `duration`
 * seconds (source → arc → ring → arc → source), deterministic in `time`. Never used on the site.
 */
export function alignmentSweep(eye: Vec3, time: number, duration: number, span = 0.5, angleDeg = 90): Vec3 {
  const s = ((time % duration) + duration) % duration;
  const offset = span * (s / duration - 0.5) * 2;
  return directionNearLineOfSight(eye, Math.abs(offset), offset < 0 ? angleDeg + 180 : angleDeg);
}

/** Rotation about world +Y as a column-major 3×3 matrix (environment lookup rotation). */
export function envRotation(angle: number, out = new Float32Array(9)): Float32Array {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  out.set([c, 0, -s, 0, 1, 0, s, 0, c]);
  return out;
}
