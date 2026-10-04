"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { RollText } from "../shared/RollText";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/404-316556f0/not-found.module.css";

/** Smoothing toward the pointer target (INFERRED; the source eases the shadows rather than snapping). */
const EASE = 0.12;

/**
 * 404 view. MEASURED: white "404" (Albert 900, 400/320, −20px tracking) over two black copies at 16% opacity
 * (blur 16px / 4px) that shift opposite to the pointer — up to 80px / 20px at the viewport edges —
 * producing an embossed shadow; at rest (pointer centred) the shadows sit exactly under the text.
 */
export function NotFoundView() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    const tick = () => {
      x += (tx - x) * EASE;
      y += (ty - y) * EASE;
      root.style.setProperty("--nd-sx", x.toFixed(3));
      root.style.setProperty("--nd-sy", y.toFixed(3));
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      ty = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <main ref={rootRef} className={s.main}>
      <div className={s.mark} aria-hidden="true">
        <span className={cn(s.digits, s.shadowFar)}>404</span>
        <span className={cn(s.digits, s.shadowNear)}>404</span>
        <span className={cn(s.digits, s.face)}>404</span>
      </div>
      <h1 className={site.visuallyHidden}>404 — Page not found</h1>
      <div className={s.text}>
        <p className={cn(site.small, s.message)}>The page you are looking for could not be found.</p>
        <Link href="/" className={s.back}>
          <RollText text="BACK TO HOMEPAGE" />
        </Link>
      </div>
    </main>
  );
}
