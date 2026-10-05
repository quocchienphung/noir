"use client";

import { useCallback, useEffect, useState } from "react";
import { BlackHoleCanvas, type BlackHoleScene } from "./BlackHoleCanvas";
import s from "@/styles/noir/black-hole-qa.module.css";

/**
 * Development-only harness: one full-viewport scene at a fixed progress, for reference matching, ablation
 * (bhDebug/bhView/bhGrain) and deterministic captures (bhT/bhScale/bhQ). Imported only by a `.dev.tsx`
 * route, so it is never part of a production bundle.
 */
export function BlackHoleQa() {
  const [cfg, setCfg] = useState<{ scene: BlackHoleScene; p: number } | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const scene = q.get("scene");
    const p = Number(q.get("p") ?? 0);
    // read once from the URL after mount (the server render has no search params)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCfg({ scene: scene === "dive" || scene === "cinematic" ? scene : "reference", p: Number.isFinite(p) ? p : 0 });
  }, []);

  const progress = cfg?.p ?? 0;
  const driver = useCallback(() => progress, [progress]);

  return <div className={s.stage}>{cfg ? <BlackHoleCanvas scene={cfg.scene} driver={driver} poster="/sites/noir/media/cinematic-poster.jpg" /> : null}</div>;
}
