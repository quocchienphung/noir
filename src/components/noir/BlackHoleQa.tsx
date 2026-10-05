"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { basisFromQ, poseFromAngles, qNorm, qRotate, type Quat } from "@/lib/noir/blackhole/orbit";
import { BlackHoleCanvas, type BlackHoleScene, type CameraHook } from "./BlackHoleCanvas";
import s from "@/styles/noir/black-hole-qa.module.css";

/**
 * Development-only harness: one full-viewport scene at a fixed progress, for reference matching, ablation
 * (bhDebug/bhView/bhGrain/bhAbl/bhGas) and deterministic captures (bhT/bhScale/bhQ). `orbit=inc,az[,r]`
 * places the camera at an exact inclination/azimuth (degrees; inclination from the +Y disk normal) with the
 * same renderer and material as the hero's 360° explore; `orbitq=x,y,z,w[,r]` sets an exact orientation. Imported only by a `.dev.tsx` route, so it is
 * never part of a production bundle.
 */
export function BlackHoleQa() {
  const [cfg, setCfg] = useState<{ scene: BlackHoleScene; p: number; orbit: number[] | null } | null>(null);
  const hook = useRef<CameraHook | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const scene = q.get("scene");
    const p = Number(q.get("p") ?? 0);
    const orbit = q.get("orbit")?.split(",").map(Number) ?? null;
    // orbitq=x,y,z,w[,r]: exact camera orientation quaternion (camera looks at the centre from −forward·r)
    const oq = q.get("orbitq")?.split(",").map(Number) ?? null;
    if (oq && oq.length >= 4 && oq.every(Number.isFinite)) {
      const quat = qNorm([oq[0], oq[1], oq[2], oq[3]] as Quat);
      const r = oq[4] ?? 20;
      hook.current = {
        active: () => true,
        resolve: (base) => {
          const f = qRotate(quat, [0, 0, 1]);
          return { pos: [-f[0] * r, -f[1] * r, -f[2] * r], basis: basisFromQ(quat), tanHalfFov: base.tanHalfFov };
        },
      };
    }
    if (orbit && orbit.length >= 2 && orbit.every(Number.isFinite)) {
      const [inc, az, r] = orbit;
      hook.current = {
        active: () => true,
        resolve: (base) => poseFromAngles(inc, az, r ?? Math.hypot(...base.pos), base.tanHalfFov),
      };
    }
    // read once from the URL after mount (the server render has no search params)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCfg({ scene: scene === "dive" || scene === "cinematic" || scene === "topdown" ? scene : "reference", p: Number.isFinite(p) ? p : 0, orbit });
  }, []);

  const progress = cfg?.p ?? 0;
  const driver = useCallback(() => progress, [progress]);

  return (
    <div className={s.stage}>
      {cfg ? <BlackHoleCanvas scene={cfg.scene} driver={driver} poster="/sites/noir/media/cinematic-poster.jpg" cameraHook={hook} /> : null}
    </div>
  );
}
