"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useMotion } from "./MotionProvider";

/**
 * next/link with the sitewide route transition. Keeps the semantic <a href>, prefetching and keyboard activation;
 * Next only calls onNavigate for same-tab SPA navigations, so modifier/middle clicks, new tabs, downloads and
 * external URLs keep their native behaviour. Same-route, query-only and hash-only targets are left to Next too.
 */
export function TransitionLink({ onNavigate, href, ...props }: ComponentProps<typeof Link>) {
  const motion = useMotion();
  return (
    <Link
      href={href}
      {...props}
      onNavigate={(e) => {
        onNavigate?.(e);
        if (!motion || typeof href !== "string") return;
        motion.navigate(href, e);
      }}
    />
  );
}
