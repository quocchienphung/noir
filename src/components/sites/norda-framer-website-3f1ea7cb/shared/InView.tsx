"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Toggles `data-inview` on its element while it intersects the viewport, so CSS can play the
 * source's in-view effects. MEASURED on the reference: these effects reset when the element leaves
 * the viewport and replay on re-entry.
 */
export function InView({
  as: Tag = "div",
  className,
  children,
  once = false,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  once?: boolean;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.setAttribute("data-inview", "");
        if (once) io.disconnect();
      } else if (!once) {
        el.removeAttribute("data-inview");
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [once]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
