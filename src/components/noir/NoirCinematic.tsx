"use client";

import { useCallback, useRef } from "react";
import { home } from "@/data/noir/site";
import { cinematicTimeline } from "@/lib/noir/cinematic-timeline";
import { BlackHoleCanvas } from "./BlackHoleCanvas";
import { NoirMark } from "./brand";
import { useScrollTimeline } from "./useScrollTimeline";
import s from "@/styles/noir/cinematic.module.css";

const LINES = home.cinematic.statement;

/**
 * Black-hole "cinematic study" (replaces the old water video section). States — pre-enter, framed,
 * expanding, statement, exit — come from `cinematicTimeline`, a pure function of the track's real
 * layout position. Canvas, mark and statement all live inside one clipped frame, so no layer can paint
 * outside it; the CSS defaults equal the framed state, so a stale first paint can never show the
 * expanded frame or the statement.
 */
export function NoirCinematic() {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const captionRef = useRef<HTMLParagraphElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  const apply = useCallback((q: number, reduced: boolean) => {
    const track = stageRef.current?.parentElement;
    // derived from the same (smoothed) progress as everything else, so state and geometry agree
    const pinned = q > 0 || (!!track && track.getBoundingClientRect().top <= 0.5);
    const narrow = window.innerWidth < 810;
    // reduced motion: one still, fully open frame with the statement shown
    const f = cinematicTimeline(reduced ? 0.8 : q, reduced || pinned, LINES.length, narrow);

    stageRef.current?.setAttribute("data-state", f.state);
    stageRef.current?.setAttribute("data-live", "");
    const frame = frameRef.current;
    if (frame) {
      frame.style.clipPath = `inset(${(f.insetY * 100).toFixed(3)}% ${(f.insetX * 100).toFixed(3)}% round ${f.radius.toFixed(2)}px)`;
    }
    if (mediaRef.current) mediaRef.current.style.transform = `scale(${f.mediaScale.toFixed(4)})`;
    const mark = markRef.current;
    if (mark) {
      mark.style.opacity = f.markOpacity.toFixed(3);
      mark.style.transform = `scale(${f.markScale.toFixed(4)})`;
    }
    lineRefs.current.forEach((el, i) => {
      if (!el) return;
      const v = f.lines[i] ?? 0;
      el.style.opacity = v.toFixed(3);
      el.style.transform = `translate3d(0, ${((1 - v) * 0.5).toFixed(3)}em, 0)`;
    });
    if (captionRef.current) captionRef.current.style.opacity = f.captionOpacity.toFixed(3);
    if (eyebrowRef.current) eyebrowRef.current.style.opacity = (f.lines[0] ?? 0).toFixed(3);
    if (scrimRef.current) scrimRef.current.style.opacity = Math.max(f.lines[0] ?? 0, f.captionOpacity).toFixed(3);
    if (textRef.current) {
      textRef.current.style.transform = `translate3d(0, ${f.exitLift.toFixed(3)}vh, 0)`;
      textRef.current.toggleAttribute("data-hidden", Math.max(...f.lines, f.captionOpacity) < 0.02);
    }
    if (shadeRef.current) shadeRef.current.style.opacity = f.sceneFade.toFixed(3);
  }, []);

  const { trackRef, driver } = useScrollTimeline<HTMLElement>(apply, 0.09, 0.12);

  return (
    <section ref={trackRef} className={s.track} aria-labelledby="noir-cinematic-title">
      <div ref={stageRef} className={s.stage} data-state="framed">
        <div ref={frameRef} className={s.frame} data-noir-frame="">
          <div ref={mediaRef} className={s.media}>
            <BlackHoleCanvas scene="cinematic" driver={driver} poster="/sites/noir/media/cinematic-poster.jpg" />
          </div>
          <div ref={shadeRef} className={s.shade} aria-hidden="true" />

          <div ref={scrimRef} className={s.scrim} aria-hidden="true" />

          <div ref={markRef} className={s.mark} aria-hidden="true">
            <NoirMark size={220} className={s.markImg} />
          </div>

          <div ref={textRef} className={s.text} data-hidden="">
            <p ref={eyebrowRef} className={s.eyebrow}>{home.cinematic.eyebrow}</p>
            <h2 id="noir-cinematic-title" className={s.statement}>
              {LINES.map((line, i) => (
                <span
                  key={line}
                  ref={(el) => {
                    lineRefs.current[i] = el;
                  }}
                  className={s.line}
                >
                  {line}
                </span>
              ))}
            </h2>
            <p ref={captionRef} className={s.caption}>
              {home.cinematic.caption}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
