"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { assets, type AssetId } from "@/data/sites/norda-framer-website-3f1ea7cb/assets";
import { coverSizes } from "@/lib/sites/norda-framer-website-3f1ea7cb/media";
import { heroSlides } from "@/data/sites/norda-framer-website-3f1ea7cb/home";
import { routes } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";
import { prefersReducedMotion } from "@/lib/sites/norda-framer-website-3f1ea7cb/scroll";
import { useScrollFrame } from "@/hooks/sites/norda-framer-website-3f1ea7cb/useScrollFrame";
import { loopTrack, useLoopSlider } from "@/hooks/sites/norda-framer-website-3f1ea7cb/useLoopSlider";
import { ArrowRightIcon, LogoMark } from "../shared/icons";
import { RollText } from "../shared/RollText";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/hero.module.css";

const wordmark = assets.FHIcLfBCbUtxnbce6yhoriDk;
const backArrow = assets.nwlVbPDjPm71hPIQuKuGlvFT9s;
const nextArrow = assets.CHv3JR1Cg48f4jEscJb6w3YkE;
const COUNT = heroSlides.length;
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Home hero: full-bleed project slideshow under a static wordmark.
 * MEASURED: no autoplay (static for 12s); arrows (desktop) or dots + swipe (touch) move one slide with a
 * decelerating ~1s slide; loops infinitely; the whole hero scrolls at half speed.
 */
export function HomeHero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { pos, animate, active, go, onTransitionEnd, dragHandlers } = useLoopSlider(COUNT);

  useScrollFrame(({ scrollY, vh }) => {
    const el = heroRef.current;
    if (!el) return;
    const y = prefersReducedMotion() ? 0 : Math.min(scrollY, vh) * 0.5;
    el.style.transform = `translate3d(0, ${y}px, 0)`;
  });

  const track = loopTrack(heroSlides);

  return (
    <section className={s.hero} aria-roledescription="carousel" aria-label="Featured projects" data-cursor="none">
      <div ref={heroRef} className={s.inner}>
        <div className={s.viewport} {...dragHandlers}>
          <ul
            className={cn(s.track, animate && s.trackAnimated)}
            style={{ "--nd-pos": pos } as CSSProperties}
            onTransitionEnd={onTransitionEnd}
          >
            {track.map((slide, i) => {
              const realIndex = (i - 1 + COUNT) % COUNT;
              const isClone = i === 0 || i === COUNT + 1;
              const current = i === pos;
              const img = assets[slide.image.asset as AssetId];
              return (
                <li
                  key={`${slide.slug}-${i}`}
                  className={s.slide}
                  aria-hidden={!current || isClone}
                  inert={!current}
                  aria-roledescription="slide"
                  aria-label={`${realIndex + 1} of ${COUNT}`}
                >
                  <Link href={routes.project(slide.slug)} className={s.slideLink} data-cursor="view-project">
                    <span className={site.visuallyHidden}>{slide.name}</span>
                    <Image
                      src={img.src}
                      alt={slide.image.alt}
                      fill
                      sizes={coverSizes(slide.image.asset, "100vw", "100vh")}
                      className={s.slideImg}
                      preload={i === 1}
                      loading={i === 1 ? undefined : "eager"}
                    />
                  </Link>
                  <div className={s.info}>
                    <p className={cn(site.label, s.number)}>
                      <span>{pad(realIndex + 1)}</span>
                      <span className={s.numberLine} aria-hidden="true" />
                      <span>{pad(COUNT)}</span>
                    </p>
                    <p className={cn(site.label, s.name)}>{slide.name}</p>
                  </div>
                  <Link href={routes.project(slide.slug)} className={s.viewLink}>
                    <RollText text="View Project" />
                    <ArrowRightIcon className={s.viewArrow} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className={s.staticLogo} aria-hidden="true" data-cursor="none">
          <LogoMark className={s.staticLogoMark} />
        </div>

        <div className={s.titleRow}>
          <h1 className={s.wordmark}>
            <span className={site.visuallyHidden}>Nordå</span>
            <Image src={wordmark.src} alt="" width={wordmark.width} height={wordmark.height} className={s.wordmarkImg} preload />
          </h1>
          <div className={s.titleSpacer} />
        </div>

        <div className={s.arrows}>
          <button type="button" className={s.arrow} onClick={() => go(-1)} aria-label="Previous project">
            <Image src={backArrow.src} alt="" width={64} height={64} />
          </button>
          <button type="button" className={s.arrow} onClick={() => go(1)} aria-label="Next project">
            <Image src={nextArrow.src} alt="" width={64} height={64} />
          </button>
        </div>

        <div className={s.dots} role="group" aria-label="Choose project">
          {heroSlides.map((slide, i) => (
            <button
              key={slide.slug}
              type="button"
              className={cn(s.dot, i === active && s.dotActive)}
              aria-label={`Show ${slide.name}`}
              aria-pressed={i === active}
              onClick={() => go(i - active)}
            >
              <span />
            </button>
          ))}
        </div>

        <p className={site.visuallyHidden} aria-live="polite">
          {`${heroSlides[active].name}, project ${active + 1} of ${COUNT}`}
        </p>
      </div>
    </section>
  );
}
