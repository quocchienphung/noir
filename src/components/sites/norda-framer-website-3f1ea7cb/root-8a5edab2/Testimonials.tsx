"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { testimonials, tickerText } from "@/data/sites/norda-framer-website-3f1ea7cb/home";
import { assets, type AssetId } from "@/data/sites/norda-framer-website-3f1ea7cb/assets";
import { Ticker } from "../shared/Ticker";
import { loopTrack, useLoopSlider } from "@/hooks/sites/norda-framer-website-3f1ea7cb/useLoopSlider";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/testimonials.module.css";

const COUNT = testimonials.length;
const backArrow = assets.Ih46Mq8uiQ56rQhTIyUJTvfIXE;
const nextArrow = assets.H3BmhpWcSqVQg81DVbYo0lExgDU;

/**
 * Testimonials: time-driven ticker ("Nordå Architects ~", ≈101px/s leftward, MEASURED) behind a
 * click/swipe slideshow (arrows on desktop, dots on touch; no autoplay observed).
 */
export function Testimonials() {
  const { pos, animate, active, go, onTransitionEnd, dragHandlers } = useLoopSlider(COUNT);
  const track = loopTrack(testimonials);

  return (
    <section className={s.testimonials} aria-roledescription="carousel" aria-label="Testimonials">
      <Ticker text={tickerText} className={s.ticker} />

      <div className={s.viewport} {...dragHandlers}>
        <ul className={cn(s.track, animate && s.trackAnimated)} style={{ "--nd-pos": pos } as CSSProperties} onTransitionEnd={onTransitionEnd}>
          {track.map((t, i) => {
            const current = i === pos;
            const a = assets[t.portrait.asset as AssetId];
            return (
              <li key={`${t.author}-${i}`} className={s.slide} aria-hidden={!current} inert={!current}>
                <figure className={s.figure}>
                  <blockquote className={s.quote}>
                    <p className={s.quoteText}>{t.quote}</p>
                  </blockquote>
                  <figcaption className={s.author}>{t.author}</figcaption>
                </figure>
                <div className={s.imageCol}>
                  <div className={s.portrait}>
                    <Image src={a.src} alt={t.portrait.alt} fill sizes="(min-width: 1200px) 280px, (min-width: 810px) 280px, 100vw" className={s.portraitImg} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={s.arrows}>
        <button type="button" className={s.arrow} onClick={() => go(-1)} aria-label="Previous testimonial">
          <Image src={backArrow.src} alt="" width={64} height={64} />
        </button>
        <button type="button" className={s.arrow} onClick={() => go(1)} aria-label="Next testimonial">
          <Image src={nextArrow.src} alt="" width={64} height={64} />
        </button>
      </div>

      <div className={s.dots} role="group" aria-label="Choose testimonial">
        {testimonials.map((t, i) => (
          <button
            key={t.author}
            type="button"
            className={cn(s.dot, i === active && s.dotActive)}
            aria-label={`Show testimonial ${i + 1}`}
            aria-pressed={i === active}
            onClick={() => go(i - active)}
          >
            <span />
          </button>
        ))}
      </div>
      <p className={site.visuallyHidden} aria-live="polite">{`Testimonial ${active + 1} of ${COUNT}`}</p>
    </section>
  );
}
