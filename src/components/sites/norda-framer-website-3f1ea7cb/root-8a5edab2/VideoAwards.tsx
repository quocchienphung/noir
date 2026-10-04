"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { assets } from "@/data/sites/norda-framer-website-3f1ea7cb/assets";
import { awards } from "@/data/sites/norda-framer-website-3f1ea7cb/home";
import { useScrollFrame } from "@/hooks/sites/norda-framer-website-3f1ea7cb/useScrollFrame";
import { clamp01, prefersReducedMotion } from "@/lib/sites/norda-framer-website-3f1ea7cb/scroll";
import { WaveMark } from "../shared/icons";
import { RecordList } from "../shared/RecordList";
import { FitText } from "../shared/FitText";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/video-awards.module.css";

const DESKTOP_LINES = ["Crafting spaces", "where natural beauty", "meets timeless, functional", "design for inspired living."];
const PHONE_LINES = ["Crafting", "spaces where", "natural beauty", "meets timeless,", "functional", "design for", "inspired living."];

/**
 * Video statement + awards list.
 * MEASURED (desktop): the video sticks at the section top and, over the first 50vh, its frame scales
 * 0.66 → 1 while the video inside counter-scales 1.2 → 1 and the wave mark fades 1 → 0 (all linear).
 * The white statement rides up in a sticky layer; the white Awards panel then scrolls over everything.
 * Tablet/phone: full-bleed video, statement pinned to the bottom, no scaling.
 */
export function VideoAwards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useScrollFrame(({ vh, vw }) => {
    const el = sectionRef.current;
    if (!el) return;
    if (vw < 1200 || prefersReducedMotion()) {
      el.style.setProperty("--nd-video-p", "1");
      return;
    }
    const top = el.getBoundingClientRect().top;
    el.style.setProperty("--nd-video-p", clamp01(-top / (vh * 0.5)).toFixed(4));
  });

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (prefersReducedMotion()) {
      v.pause();
      return;
    }
    // Only decode/play while near the viewport.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void v.play().catch(() => undefined);
        else v.pause();
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className={s.section}>
      <div className={s.flow}>
        <div className={s.spacer} aria-hidden="true" />
        <section className={s.awardsPanel} aria-labelledby="nd-awards-title">
          <RecordList
            id="nd-awards-title"
            title="Awards"
            rows={awards.map((a, i) => ({ title: a.title, meta: a.organisation, year: a.year, cursor: `award-${i + 1}` }))}
          />
        </section>
      </div>

      <div className={s.videoLayer}>
        <div className={s.videoSticky}>
          <div className={s.videoFrame}>
            <video
              ref={videoRef}
              className={s.video}
              src={assets.RPCvbH4eTYU7lPNivoY0mYV63qw.src}
              muted
              loop
              playsInline
              autoPlay
              preload="metadata"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>

      <div className={s.logoLayer} aria-hidden="true">
        <div className={s.logoSticky}>
          <WaveMark className={s.wave} />
        </div>
      </div>

      <div className={s.textLayer}>
        <div className={s.textLead} aria-hidden="true" />
        <div className={s.textSticky}>
          <h2 className={s.statement}>
            <span className={site.visuallyHidden}>{DESKTOP_LINES.join(" ")}</span>
            <FitText lines={DESKTOP_LINES} viewBox="0 0 1200 490" fontSize={108.79419764279238} letterSpacing="-0.04em" lineHeight="90%" className={cn(s.fitWide, s.statementText)} />
            <FitText lines={PHONE_LINES} viewBox="0 0 342 348" fontSize={51.19492466650879} letterSpacing="-0.04em" lineHeight="90%" className={cn(s.fitNarrow, s.statementText)} />
          </h2>
        </div>
      </div>
    </div>
  );
}
