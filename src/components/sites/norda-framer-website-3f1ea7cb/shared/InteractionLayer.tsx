"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { assets } from "@/data/sites/norda-framer-website-3f1ea7cb/assets";
import { coverSizes } from "@/lib/sites/norda-framer-website-3f1ea7cb/media";
import { awards } from "@/data/sites/norda-framer-website-3f1ea7cb/home";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/cursor.module.css";

const ROLL_MS = 300;
const ROLL_STAGGER_MS = 35;
/** Per-frame smoothing toward the pointer (INFERRED fit of the measured follow lag). */
const FOLLOW = 0.18;

/**
 * Site-wide pointer effects, mounted once:
 *  - the cursor follower for fine pointers. MEASURED from the source's Framer cursor zones: the nearest
 *    `data-cursor` ancestor decides the variant — "dot" (20px black, the page default set on SiteShell),
 *    "dot-white" (footer, video + awards, menu overlay), "none" (chrome controls, footer controls, form
 *    fields, scroll links and other listed controls), "view-project", "read-article", "award-n".
 *    `data-cursor-min="1200"` limits a zone to desktop widths (the source's tablet variants omit the award
 *    previews, project labels and the testimonial dot), falling through to the parent zone;
 *  - the delegated controller that starts RollText animations on pointer enter.
 */
export function InteractionLayer() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    let tx = -100;
    let ty = -100;
    let x = tx;
    let y = ty;
    let raf = 0;
    let active = "";
    const isHidden = (v: string) => !v || v === "none";
    const resolveZone = (el: Element | null) => {
      for (let n = el?.closest<HTMLElement>("[data-cursor]"); n; n = n.parentElement?.closest<HTMLElement>("[data-cursor]")) {
        const min = Number(n.dataset.cursorMin ?? 0);
        if (window.innerWidth >= min) return n.dataset.cursor ?? "";
      }
      return "";
    };

    const setVariant = (v: string) => {
      if (v === active) return;
      active = v;
      root.dataset.variant = v || "none";
    };

    const tick = () => {
      raf = 0;
      const k = reduced.matches ? 1 : FOLLOW;
      x += (tx - x) * k;
      y += (ty - y) * k;
      root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (!fine.matches || e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      const el = e.target as Element | null;
      const next = resolveZone(el);
      // Start from the pointer when becoming visible so the follower never flies in from its last spot.
      if (isHidden(active) && !isHidden(next)) {
        x = tx;
        y = ty;
      }
      setVariant(next);
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onLeaveWindow = () => setVariant("");

    // ---- RollText controller ----
    const onOver = (e: PointerEvent) => {
      if (reduced.matches) return;
      const host = (e.target as Element | null)?.closest("a, button");
      if (!host) return;
      const from = e.relatedTarget as Node | null;
      if (from && host.contains(from)) return;
      host.querySelectorAll<HTMLElement>("[data-roll]").forEach((roll) => {
        if (roll.hasAttribute("data-rolling")) return;
        roll.setAttribute("data-rolling", "");
        const count = roll.querySelectorAll("[style]").length;
        window.setTimeout(() => roll.removeAttribute("data-rolling"), ROLL_MS + count * ROLL_STAGGER_MS + 30);
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeaveWindow);
    document.addEventListener("pointerover", onOver);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeaveWindow);
      document.removeEventListener("pointerover", onOver);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={rootRef} className={s.follower} data-variant="none" aria-hidden="true">
      <div className={s.dot} />
      <div className={cn(s.label, s.viewProject)}>
        <span>VIEW PROJECT</span>
        <Corners />
      </div>
      <div className={cn(s.label, s.readArticle)}>
        <span>READ ARTICLE</span>
        <Corners />
      </div>
      {awards.map((award, i) => {
        const a = assets[award.preview.asset as keyof typeof assets];
        return (
          <div key={award.title} className={s.preview} data-preview={`award-${i + 1}`}>
            <Image src={a.src} alt="" fill sizes={coverSizes(award.preview.asset, "24.9vh", "33vh")} className={s.previewImg} />
          </div>
        );
      })}
    </div>
  );
}

function Corners() {
  return (
    <span className={s.corners}>
      <span className={s.cornerBL} />
      <span className={s.cornerBR} />
      <span className={s.cornerTL} />
      <span className={s.cornerTR} />
    </span>
  );
}
