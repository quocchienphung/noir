"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { intro } from "@/data/noir/intro";
import { horizonDistance } from "@/lib/noir/blackhole/scenes";
import { BlackHoleCanvas } from "./BlackHoleCanvas";
import { useScrollTimeline } from "./useScrollTimeline";
import s from "@/styles/noir/intro.module.css";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** 0 → 1 between a and b, eased (smoothstep). */
const seg = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const TICKS = 24;

/**
 * Scroll-driven dive toward a ray-traced black hole. The section is a tall scroll track with a sticky
 * stage; raw progress is read from the track's real position every frame and exponentially smoothed so
 * fast wheels, Home/End and back-to-top glide instead of jumping. All copy is live DOM text; the canvas
 * is decorative. With reduced motion the dive collapses to a single still scene with the copy beneath.
 */
export function NoirIntro() {
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLParagraphElement>(null);
  const gaugeRef = useRef<HTMLDivElement>(null);
  const gaugeValueRef = useRef<HTMLSpanElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const gaugeText = useRef("");

  const apply = useCallback((raw: number, reduced: boolean) => {
    const p = reduced ? 0 : raw;
    const head = seg(0, 0.3, p);
    const lead = seg(0, 0.16, p);
    const cue = seg(0, 0.07, p);
    const stmt = reduced ? 1 : seg(0.8, 0.99, p);

    const l1 = line1Ref.current;
    const l2 = line2Ref.current;
    if (l1 && l2) {
      const sx = 1 + 0.35 * head;
      const sy = 1 - 0.3 * head;
      const blur = 14 * head;
      const op = 1 - seg(0.05, 0.3, p);
      l1.style.transform = `translate3d(0, ${(-6 * head).toFixed(3)}vh, 0) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
      l2.style.transform = `translate3d(0, ${(6 * head).toFixed(3)}vh, 0) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
      l1.style.filter = l2.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
      l1.style.opacity = l2.style.opacity = op.toFixed(3);
    }
    const leadEl = leadRef.current;
    if (leadEl) {
      leadEl.style.opacity = (1 - lead).toFixed(3);
      leadEl.style.filter = lead > 0.01 ? `blur(${(8 * lead).toFixed(2)}px)` : "";
      leadEl.style.transform = `translate3d(0, ${(-2 * lead).toFixed(3)}vh, 0)`;
      // faded-out controls must not keep focus or catch clicks
      leadEl.toggleAttribute("data-hidden", lead > 0.6);
    }
    if (cueRef.current) cueRef.current.style.opacity = (1 - cue).toFixed(3);
    if (scrimRef.current) scrimRef.current.style.opacity = (1 - head).toFixed(3);

    const g = gaugeRef.current;
    if (g) {
      g.style.setProperty("--gauge-y", p.toFixed(4));
      g.style.opacity = (1 - seg(0.9, 0.99, p)).toFixed(3);
    }
    const value = horizonDistance(p).toFixed(2);
    if (gaugeValueRef.current && value !== gaugeText.current) {
      gaugeText.current = value;
      gaugeValueRef.current.textContent = value;
    }

    const sm = statementRef.current;
    if (sm) {
      sm.style.opacity = stmt.toFixed(3);
      sm.style.filter = stmt < 0.99 ? `blur(${(16 * (1 - stmt)).toFixed(2)}px)` : "";
      sm.style.transform = stmt < 1 ? `scale(${(0.94 + 0.06 * stmt).toFixed(4)})` : "";
      sm.toggleAttribute("data-hidden", stmt < 0.4);
    }
  }, []);

  // τ ≈ 0.12 s: smooth through wheel steps and long jumps, never laggy enough to feel detached.
  const { trackRef, driver } = useScrollTimeline<HTMLElement>(apply, 0.12, 0.2);

  return (
    <section
      ref={trackRef}
      className={s.track}
      aria-labelledby="noir-intro-title"
    >
      <div className={s.stage}>
        <div className={s.scene}>
          <BlackHoleCanvas
            scene="dive"
            driver={driver}
            poster="/sites/noir/media/dive-poster.jpg"
            className={s.canvas}
          />
          <div ref={scrimRef} className={s.scrim} aria-hidden="true" />

          <h1 id="noir-intro-title" className={s.headline}>
            <span ref={line1Ref} className={s.line1}>
              {intro.headline[0]}
            </span>{" "}
            <span ref={line2Ref} className={s.line2}>
              {intro.headline[1]}
            </span>
          </h1>

          <div ref={leadRef} className={s.lead}>
            <p className={s.leadText}>{intro.lead}</p>
            <div className={s.ctas}>
              <Link href={intro.primaryCta.href} className={s.ctaPrimary}>
                {intro.primaryCta.label}
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className={s.ctaIcon}
                >
                  <path
                    d="M5 11 11 5M6 5h5v5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </Link>
              <Link href={intro.secondaryCta.href} className={s.ctaSecondary}>
                {intro.secondaryCta.label}
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className={s.ctaIcon}
                >
                  <path
                    d="M3 8h10M9 4l4 4-4 4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </Link>
            </div>
          </div>

          <div ref={gaugeRef} className={s.gauge}>
            <span className={s.gaugeLabel}>{intro.gaugeLabel}</span>
            <span className={s.gaugeValue}>
              r = <span ref={gaugeValueRef}>20.00</span> r<sub>s</sub>
            </span>
          </div>
          <div className={s.ruler} aria-hidden="true">
            {Array.from({ length: TICKS }, (_, i) => (
              <span key={i} className={i % 4 === 0 ? s.tickMajor : s.tick} />
            ))}
          </div>

          <p ref={cueRef} className={s.cue} aria-hidden="true">
            {intro.cue}
            <span className={s.cueLine} />
          </p>
        </div>

        <div ref={statementRef} className={s.statement} data-noir-intro-statement="">
          <h2 className={s.statementTitle}>{intro.statement.title}</h2>
          <p className={s.statementBody}>{intro.statement.body}</p>
        </div>
      </div>
    </section>
  );
}
