"use client";

import Image from "next/image";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { assets, type AssetId } from "@/data/sites/norda-framer-website-3f1ea7cb/assets";
import { useScrollFrame } from "@/hooks/sites/norda-framer-website-3f1ea7cb/useScrollFrame";
import { clamp01, prefersReducedMotion } from "@/lib/sites/norda-framer-website-3f1ea7cb/scroll";
import { PlusMarker } from "./icons";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/parallax.module.css";

/**
 * Framed image with the source's scroll parallax.
 * MEASURED: the image is 300px taller than its frame and translates from -300px → 0 linearly
 * while the frame travels from entering the viewport bottom to leaving its top.
 */
export function ParallaxImage({
  asset,
  alt,
  className,
  corners = true,
  sizes = "(min-width: 1200px) calc(100vw - 128px), (min-width: 810px) calc(100vw - 96px), calc(100vw - 48px)",
  preload = false,
  children,
}: {
  asset: string;
  alt: string;
  className?: string;
  corners?: boolean;
  sizes?: string;
  preload?: boolean;
  /** Overlay content positioned over the frame (e.g. the rotating badge on About). */
  children?: ReactNode;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const a = assets[asset as AssetId];

  useScrollFrame(({ vh }) => {
    const frame = frameRef.current;
    if (!frame) return;
    if (prefersReducedMotion()) {
      frame.style.setProperty("--nd-parallax", "1");
      return;
    }
    const r = frame.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) return;
    const p = clamp01((vh - r.top) / (vh + r.height));
    frame.style.setProperty("--nd-parallax", p.toFixed(4));
  });

  return (
    <div ref={frameRef} className={cn(s.frame, className)}>
      <div className={s.media}>
        <Image src={a.src} alt={alt} fill sizes={sizes} className={s.img} preload={preload} />
      </div>
      {corners && (
        <div className={s.corners} aria-hidden="true">
          <PlusMarker className={cn(s.plus, s.tl)} />
          <PlusMarker className={cn(s.plus, s.tr)} />
          <PlusMarker className={cn(s.plus, s.br)} />
          <PlusMarker className={cn(s.plus, s.bl)} />
        </div>
      )}
      {children}
    </div>
  );
}
