"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type ReactNode } from "react";
import type { ImageRef } from "@/types/sites/norda-framer-website-3f1ea7cb";
import { CONTENT_WIDTH, coverSizes, imageAsset } from "@/lib/sites/norda-framer-website-3f1ea7cb/media";
import { routes } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";
import { clamp01, prefersReducedMotion } from "@/lib/sites/norda-framer-website-3f1ea7cb/scroll";
import { useScrollFrame } from "@/hooks/sites/norda-framer-website-3f1ea7cb/useScrollFrame";
import { PlusMarker, ArrowRightIcon } from "../shared/icons";
import { RollText } from "../shared/RollText";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/projects-902ceeb2/stack.module.css";

export interface StackProject {
  slug: string;
  name: string;
  cover: ImageRef;
}

/**
 * Sticky project stack. MEASURED (desktop): each 80vh card sticks at top 160px; while the element after it
 * (the next card, or the archive for the last card) rises over it, the covered card's frame shrinks to 60%
 * about its centre (content stays unscaled and clipped). Tablet/phone: ordinary flow with a "View Project"
 * link. `children` (the archive) share the sticky containing block so it scrolls over the last stuck card.
 * The source eases the shrink slightly behind the scroll (spring-smoothed, I); here it tracks scroll directly.
 */
export function ProjectStack({ projects, children }: { projects: StackProject[]; children?: ReactNode }) {
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useScrollFrame(({ vw }) => {
    const cards = cardRefs.current;
    const off = vw < 1200 || prefersReducedMotion();
    cards.forEach((card) => {
      if (!card) return;
      const next = card.nextElementSibling;
      if (off || !next) {
        card.style.setProperty("--nd-shrink", "0");
        return;
      }
      const a = card.getBoundingClientRect();
      const b = next.getBoundingClientRect();
      // 0 when the next card's top meets this card's bottom, 1 when it has fully covered this card.
      const p = clamp01((a.bottom - b.top) / a.height);
      card.style.setProperty("--nd-shrink", p.toFixed(4));
    });
  });

  return (
    <div className={s.stack}>
      {projects.map((p, i) => {
        const img = imageAsset(p.cover.asset);
        return (
          <article
            key={p.slug}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={s.card}
          >
            <Link href={routes.project(p.slug)} className={s.link}>
              {/* MEASURED: VIEW PROJECT applies to the (shrinking) frame on desktop; margins and tablet keep the dot. */}
              <span className={s.frame} data-cursor="view-project" data-cursor-min={1200}>
                <Image src={img.src} alt={p.cover.alt} fill sizes={coverSizes(p.cover.asset, CONTENT_WIDTH, "80vh")} className={s.img} />
                <span className={s.corners} aria-hidden="true">
                  <PlusMarker className={s.tl} />
                  <PlusMarker className={s.tr} />
                  <PlusMarker className={s.br} />
                  <PlusMarker className={s.bl} />
                </span>
                <span className={s.content}>
                  <span className={s.name}>{p.name}</span>
                  <span className={s.view} aria-hidden="true">
                    <RollText text="View Project" />
                    <ArrowRightIcon className={s.viewArrow} />
                  </span>
                </span>
              </span>
            </Link>
          </article>
        );
      })}
      {children}
    </div>
  );
}
