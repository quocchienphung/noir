// 360° explore camera for the hero black hole: a quaternion trackball around the hole's centre.
//
// The camera's orientation is one unit quaternion. Dragging rotates it about the camera's *own* up and
// right axes (right-multiplication), so there is no world-up vector, no gimbal lock and no flip at the
// poles: drag horizontally for as many turns as you like, vertically straight over the top and under the
// disk. The camera always sits on a sphere around the centre and looks at it (position = −forward·R),
// outside the gas slab, and the scene (disk, gas time, lensing) is never rotated — only the camera moves
// and the renderer re-traces every ray.

export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number]; // x, y, z, w

export interface Pose {
  pos: Vec3;
  /** Column-major basis: right, up, forward (as the renderer expects). */
  basis: Float32Array;
  tanHalfFov: number;
}

const norm3 = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export function qMul(a: Quat, b: Quat): Quat {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}

export function qNorm(q: Quat): Quat {
  const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
}

export function qAxisAngle(axis: Vec3, angle: number): Quat {
  const s = Math.sin(angle / 2);
  const n = norm3(axis);
  return [n[0] * s, n[1] * s, n[2] * s, Math.cos(angle / 2)];
}

/** Rotates v by q. */
export function qRotate(q: Quat, v: Vec3): Vec3 {
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2] - z * v[1]);
  const ty = 2 * (z * v[0] - x * v[2]);
  const tz = 2 * (x * v[1] - y * v[0]);
  return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)];
}

/** Shortest-arc spherical interpolation. */
export function qSlerp(a: Quat, b: Quat, t: number): Quat {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  let bb = b;
  if (d < 0) {
    d = -d;
    bb = [-b[0], -b[1], -b[2], -b[3]];
  }
  if (d > 0.9995) return qNorm([a[0] + (bb[0] - a[0]) * t, a[1] + (bb[1] - a[1]) * t, a[2] + (bb[2] - a[2]) * t, a[3] + (bb[3] - a[3]) * t]);
  const th = Math.acos(Math.min(1, d));
  const s = Math.sin(th);
  const wa = Math.sin((1 - t) * th) / s;
  const wb = Math.sin(t * th) / s;
  return [a[0] * wa + bb[0] * wb, a[1] * wa + bb[1] * wb, a[2] * wa + bb[2] * wb, a[3] * wa + bb[3] * wb];
}

/** Quaternion from an orthonormal basis (columns right, up, forward). */
export function qFromBasis(b: Float32Array | number[]): Quat {
  // rotation matrix columns: X = right, Y = up, Z = forward
  const m00 = b[0], m10 = b[1], m20 = b[2];
  const m01 = b[3], m11 = b[4], m21 = b[5];
  const m02 = b[6], m12 = b[7], m22 = b[8];
  const tr = m00 + m11 + m22;
  let q: Quat;
  if (tr > 0) {
    const s = Math.sqrt(tr + 1) * 2;
    q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, 0.25 * s];
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    q = [0.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s];
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    q = [(m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m02 - m20) / s];
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
    q = [(m02 + m20) / s, (m12 + m21) / s, 0.25 * s, (m10 - m01) / s];
  }
  return qNorm(q);
}

export function basisFromQ(q: Quat): Float32Array {
  const r = qRotate(q, [1, 0, 0]);
  const u = qRotate(q, [0, 1, 0]);
  const f = qRotate(q, [0, 0, 1]);
  return new Float32Array([r[0], r[1], r[2], u[0], u[1], u[2], f[0], f[1], f[2]]);
}

/** Interpolates two camera poses: orientation by slerp, position on the sphere (never through the hole). */
export function blendPose(a: Pose, b: Pose, t: number): Pose {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const q = qSlerp(qFromBasis(a.basis), qFromBasis(b.basis), t);
  const ra = Math.hypot(...a.pos), rb = Math.hypot(...b.pos);
  const da = norm3(a.pos), db = norm3(b.pos);
  // slerp of the position direction about the centre
  const dot = Math.max(-1, Math.min(1, da[0] * db[0] + da[1] * db[1] + da[2] * db[2]));
  const th = Math.acos(dot);
  let d: Vec3;
  if (th < 1e-4) d = da;
  else {
    const s = Math.sin(th);
    const wa = Math.sin((1 - t) * th) / s, wb = Math.sin(t * th) / s;
    d = norm3([da[0] * wa + db[0] * wb, da[1] * wa + db[1] * wb, da[2] * wa + db[2] * wb]);
  }
  const r = ra + (rb - ra) * t;
  return { pos: [d[0] * r, d[1] * r, d[2] * r], basis: basisFromQ(q), tanHalfFov: a.tanHalfFov + (b.tanHalfFov - a.tanHalfFov) * t };
}

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

export type ExploreMode = "scroll" | "entering" | "orbit" | "returning";

/**
 * Explore controller: the single owner of the hero camera while exploring. Each frame the canvas hands it
 * the scroll camera (`base`) and gets back the pose to render. Input methods only change internal state
 * (no React renders per pointer move).
 */
export class OrbitController {
  mode: ExploreMode = "scroll";
  private q: Quat = [0, 0, 0, 1];
  private q0: Quat = [0, 0, 0, 1];
  private radius = 20;
  private tanHalfFov = Math.tan((52 * Math.PI) / 360);
  private vel: [number, number] = [0, 0]; // yaw/pitch rad/s (camera-local)
  private blend = 0; // 0 = scroll camera, 1 = orbit camera
  private resetFrom: Quat | null = null;
  private resetT = 0;
  private dragging = false;
  private lastBase: Pose | null = null;
  /** Durations (s): entering/returning blend and reset; inertia time constant. */
  enterTime = 0.38;
  returnTime = 0.38;
  resetTime = 0.4;
  inertiaTau = 0.16;
  reducedMotion = false;
  onModeChange: ((m: ExploreMode) => void) | null = null;

  /** Subscribes to mode transitions (one listener; pass null to clear). */
  listen(fn: ((m: ExploreMode) => void) | null) {
    this.onModeChange = fn;
  }

  setReducedMotion(v: boolean) {
    this.reducedMotion = v;
  }

  get active() {
    return this.mode !== "scroll";
  }

  private setMode(m: ExploreMode) {
    if (m === this.mode) return;
    this.mode = m;
    this.onModeChange?.(m);
  }

  /** Starts exploring from the pose currently on screen (the last scroll pose this controller resolved). */
  enter(baseIn?: Pose): boolean {
    const base = baseIn ?? this.lastBase;
    if (!base) return false;
    if (this.mode === "orbit" || this.mode === "entering") return true;
    if (this.mode === "returning") {
      // re-entering mid-return: keep the current orbit orientation and blend forward again
      this.setMode("entering");
      return true;
    }
    const r = Math.hypot(...base.pos);
    // orbit pose: same position, looking straight at the centre, roll taken from the current up vector
    const f = norm3([-base.pos[0], -base.pos[1], -base.pos[2]]);
    const upHint: Vec3 = [base.basis[3], base.basis[4], base.basis[5]];
    let right = norm3([upHint[1] * f[2] - upHint[2] * f[1], upHint[2] * f[0] - upHint[0] * f[2], upHint[0] * f[1] - upHint[1] * f[0]]);
    if (!Number.isFinite(right[0])) right = [1, 0, 0];
    const up: Vec3 = [f[1] * right[2] - f[2] * right[1], f[2] * right[0] - f[0] * right[2], f[0] * right[1] - f[1] * right[0]];
    this.q = qFromBasis([right[0], right[1], right[2], up[0], up[1], up[2], f[0], f[1], f[2]]);
    this.q0 = this.q;
    this.radius = Math.max(r, 6);
    this.tanHalfFov = base.tanHalfFov;
    this.vel = [0, 0];
    this.resetFrom = null;
    this.blend = 0;
    this.setMode("entering");
    return true;
  }

  /** Leaves exploring: blends back to the (live) scroll camera. */
  exit() {
    if (this.mode === "scroll" || this.mode === "returning") return;
    this.dragging = false;
    this.vel = [0, 0];
    this.setMode("returning");
  }

  reset() {
    if (this.mode !== "orbit" && this.mode !== "entering") return;
    this.vel = [0, 0];
    this.resetFrom = this.q;
    this.resetT = 0;
  }

  dragStart() {
    this.dragging = true;
    this.vel = [0, 0];
    this.resetFrom = null; // a new drag interrupts a running reset
    if (this.mode === "entering") this.setMode("orbit");
  }

  /**
   * Rotation by an angle pair (rad). Yaw turns the camera about the disk's axis (world +Y), so a sideways
   * drag circles the black hole at constant inclination; pitch turns it about the camera's own right
   * axis, so a vertical drag goes straight over a pole and under the disk without any clamp. When the
   * camera is upside down (past a pole) the yaw sign follows, so dragging right still turns the scene the
   * same way on screen. No world-up cross product is involved anywhere, so nothing degenerates at a pole.
   */
  rotate(yaw: number, pitch: number, dt: number) {
    const up = qRotate(this.q, [0, 1, 0]);
    const sign = up[1] >= 0 ? 1 : -1;
    const qy = qAxisAngle([0, 1, 0], yaw * sign);
    const qp = qAxisAngle([1, 0, 0], pitch);
    this.q = qNorm(qMul(qMul(qy, this.q), qp));
    if (dt > 0 && !this.reducedMotion) {
      // velocity estimate for a short inertial coast after release
      const k = 1 - Math.exp(-dt / 0.05);
      this.vel[0] += (yaw / dt - this.vel[0]) * k;
      this.vel[1] += (pitch / dt - this.vel[1]) * k;
    }
  }

  dragEnd() {
    this.dragging = false;
    if (this.reducedMotion) this.vel = [0, 0];
    // cap the coast so a flick cannot spin for seconds
    const cap = 6;
    this.vel = [Math.max(-cap, Math.min(cap, this.vel[0])), Math.max(-cap, Math.min(cap, this.vel[1]))];
  }

  /** An aborted gesture (pointercancel, lost capture, blur): stop where it is, no coast. */
  dragCancel() {
    this.dragging = false;
    this.vel = [0, 0];
  }

  /** Current orbit pose (no blending). */
  orbitPose(): Pose {
    const f = qRotate(this.q, [0, 0, 1]);
    return { pos: [-f[0] * this.radius, -f[1] * this.radius, -f[2] * this.radius], basis: basisFromQ(this.q), tanHalfFov: this.tanHalfFov };
  }

  /** Advances transitions/inertia and resolves the pose to render this frame. */
  resolve(base: Pose, dtIn: number): Pose {
    const dt = Math.min(Math.max(dtIn, 0), 0.05); // resume after a pause without a velocity spike
    this.lastBase = base;
    if (this.mode === "scroll") return base;

    if (!this.dragging && (this.vel[0] !== 0 || this.vel[1] !== 0)) {
      this.rotate(this.vel[0] * dt, this.vel[1] * dt, 0);
      const d = Math.exp(-dt / this.inertiaTau);
      this.vel = [this.vel[0] * d, this.vel[1] * d];
      if (Math.abs(this.vel[0]) + Math.abs(this.vel[1]) < 0.05) this.vel = [0, 0]; // < 0.05°/frame: stop
    }
    if (this.resetFrom) {
      this.resetT = Math.min(1, this.resetT + (this.reducedMotion ? 1 : dt / this.resetTime));
      this.q = qSlerp(this.resetFrom, this.q0, smooth(this.resetT));
      if (this.resetT >= 1) this.resetFrom = null;
    }

    if (this.mode === "entering") {
      this.blend = Math.min(1, this.blend + (this.reducedMotion ? 1 : dt / this.enterTime));
      if (this.blend >= 1) this.setMode("orbit");
    } else if (this.mode === "returning") {
      this.blend = Math.max(0, this.blend - (this.reducedMotion ? 1 : dt / this.returnTime));
      if (this.blend <= 0) {
        this.setMode("scroll");
        return base;
      }
    } else this.blend = 1;

    return blendPose(base, this.orbitPose(), smooth(this.blend));
  }

  /** Orbit orientation as inclination (deg from the +Y disk normal) and azimuth (deg), for QA/aria. */
  angles(): { inclination: number; azimuth: number } {
    const p = this.orbitPose().pos;
    const r = Math.hypot(...p) || 1;
    return { inclination: (Math.acos(p[1] / r) * 180) / Math.PI, azimuth: ((Math.atan2(p[0], -p[2]) * 180) / Math.PI + 360) % 360 };
  }
}

/** Camera pose at inclination `inc` (deg from the +Y disk normal) and azimuth `az` (deg), radius `r`. */
export function poseFromAngles(inc: number, az: number, r: number, tanHalfFov: number): Pose {
  const D = Math.PI / 180;
  const q = qNorm(qMul(qAxisAngle([0, 1, 0], -az * D), qAxisAngle([1, 0, 0], (90 - inc) * D)));
  const f = qRotate(q, [0, 0, 1]);
  return { pos: [-f[0] * r, -f[1] * r, -f[2] * r], basis: basisFromQ(q), tanHalfFov };
}
