"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { assets } from "@/data/sites/norda-framer-website-3f1ea7cb/assets";
import { awards } from "@/data/sites/norda-framer-website-3f1ea7cb/home";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/cursor.module.css";

const ROLL_MS = 300;
const ROLL_STAGGER_MS = 35;
/** Per-frame smoothing toward the pointer (INFERRED fit of the measured follow lag). */
const FOLLOW = 0.18;

/**
 * Site-wide pointer effects, mounted once:
 *  - the cursor follower (20px dot over links/controls, "VIEW PROJECT" / "READ ARTICLE" labels and
 *    award previews), shown only
 *    for fine pointers over elements carrying `data-cursor`;
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
      if (!active) {
        // Start from the pointer when becoming visible so the label never flies in from 0,0.
        if (root.dataset.variant === "none") {
          x = tx;
          y = ty;
        }
      }
      const el = e.target as Element | null;
      const target = el?.closest<HTMLElement>("[data-cursor]");
      // MEASURED: links, buttons and form fields carry the source's "dot" cursor zone.
      const interactive = el?.closest("a, button, form, label, [role='note']");
      setVariant(target?.dataset.cursor ?? (interactive ? "dot" : ""));
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
            <Image src={a.src} alt="" fill sizes="33vh" className={s.previewImg} />
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
