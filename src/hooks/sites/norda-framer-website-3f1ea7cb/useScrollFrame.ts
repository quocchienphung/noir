"use client";

import { useEffect, useRef } from "react";
import { subscribeScroll, type ScrollFrame } from "@/lib/sites/norda-framer-website-3f1ea7cb/scroll";

/**
 * Calls `onFrame` on mount and on every animation frame after scroll/resize.
 * The callback should write styles / CSS variables directly to DOM nodes — never set React state.
 */
export function useScrollFrame(onFrame: (frame: ScrollFrame) => void) {
  const ref = useRef(onFrame);
  useEffect(() => {
    ref.current = onFrame;
  });
  useEffect(() => subscribeScroll((frame) => ref.current(frame)), []);
}
