"use client";

import { useRef, type ReactNode } from "react";
import { useScrollFrame } from "@/hooks/sites/norda-framer-website-3f1ea7cb/useScrollFrame";
import { prefersReducedMotion } from "@/lib/sites/norda-framer-website-3f1ea7cb/scroll";

/** Moves its content down by half the scroll distance while the header is on screen (MEASURED 0.5×). */
export function HalfSpeed({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useScrollFrame(({ scrollY, vh }) => {
    const el = ref.current;
    if (!el) return;
    const y = prefersReducedMotion() ? 0 : Math.min(scrollY, vh * 1.2) * 0.5;
    el.style.transform = `translate3d(0, ${y}px, 0)`;
  });
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
