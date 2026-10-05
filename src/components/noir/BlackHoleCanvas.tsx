"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { BlackHoleRenderer } from "@/lib/noir/blackhole/renderer";
import { cinematicFrame, diveFrame, type Pointer, type SceneInput } from "@/lib/noir/blackhole/scenes";
import s from "@/styles/noir/black-hole.module.css";

export type BlackHoleScene = "dive" | "cinematic";

/** Called once per animation frame; returns the (smoothed) timeline progress to render, 0…1. */
export type BlackHoleDriver = (dt: number) => number;

const MIN_SCALE = 0.32;
/** Ray-traced pixels per frame we aim for before adaptive quality kicks in (~0.65 Mpx). */
const PIXEL_BUDGET = 650_000;

/** Render scale from a pixel budget: small phone canvases render near-native, large desktops ~0.65. */
function initialScale(cssW: number, cssH: number, dpr: number) {
  return Math.min(1, Math.max(MIN_SCALE, Math.sqrt(PIXEL_BUDGET / Math.max(1, cssW * cssH * dpr * dpr))));
}

/**
 * WebGL2 black-hole canvas. Owns the render loop: runs only while the element is near the viewport and the
 * tab is visible, adapts its internal resolution to the measured frame time, follows the pointer for a
 * slight parallax, pauses for reduced motion, recovers from context loss and frees the GPU context on
 * unmount. If WebGL2 is unavailable the poster image (rendered from this same scene) stays in place.
 */
export function BlackHoleCanvas({
  scene,
  driver,
  poster,
  className,
}: {
  scene: BlackHoleScene;
  driver: BlackHoleDriver;
  poster: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const driverRef = useRef(driver);
  const [status, setStatus] = useState<"init" | "live" | "fallback">("init");

  useEffect(() => {
    driverRef.current = driver;
  }, [driver]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fineMq = window.matchMedia("(hover: hover) and (pointer: fine)");
    let renderer: BlackHoleRenderer | null = null;
    let raf = 0;
    let running = false;
    let inView = false;
    let last = performance.now();
    const dprNow = () => Math.min(window.devicePixelRatio || 1, 1.5);
    const rect0 = wrap.getBoundingClientRect();
    let scale = initialScale(rect0.width, rect0.height, dprNow());
    let maxScale = scale;
    let ema = 16;
    let slow = 0;
    let fast = 0;
    let aspect = 16 / 9;
    let shown = false;
    let lastKey = "";
    const pointer: Pointer = { x: 0, y: 0 };
    const target: Pointer = { x: 0, y: 0 };
    const startTime = performance.now();

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      aspect = rect.width / Math.max(1, rect.height);
      const dpr = dprNow();
      maxScale = initialScale(rect.width, rect.height, dpr);
      scale = Math.min(scale, maxScale);
      renderer?.resize(rect.width * dpr * scale, rect.height * dpr * scale);
      lastKey = "";
    };

    const setup = () => {
      renderer = BlackHoleRenderer.create(canvas);
      if (!renderer) {
        requestAnimationFrame(() => setStatus("fallback"));
        return;
      }
      resize();
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.1, Math.max(0.001, (now - last) / 1000));
      last = now;
      const k = 1 - Math.exp(-dt / 0.35);
      pointer.x += (target.x - pointer.x) * k;
      pointer.y += (target.y - pointer.y) * k;
      const progress = driverRef.current(dt);

      if (renderer) {
        const reduced = reducedMq.matches;
        const time = reduced ? 0 : (now - startTime) / 1000;
        // with reduced motion only re-render when the timeline actually moves
        const key = reduced ? `${progress.toFixed(4)}|${renderer.width}` : "";
        if (!reduced || key !== lastKey) {
          lastKey = key;
          const wide = renderer.width * renderer.height;
          const input: SceneInput = {
            progress,
            pointer: reduced ? { x: 0, y: 0 } : pointer,
            time,
            aspect,
            steps: wide > 900_000 ? 220 : wide > 400_000 ? 200 : 170,
          };
          renderer.render(scene === "dive" ? diveFrame(input) : cinematicFrame(input));
          if (!shown) {
            shown = true;
            canvas.dataset.ready = "";
            requestAnimationFrame(() => setStatus("live"));
          }
        }
        // adaptive resolution from the frame interval (the GPU work shows up as frame time)
        ema = ema * 0.92 + dt * 1000 * 0.08;
        if (ema > 24) {
          slow++;
          fast = 0;
        } else if (ema < 13) {
          fast++;
          slow = 0;
        } else {
          slow = fast = 0;
        }
        if (slow > 30 && scale > MIN_SCALE) {
          scale = Math.max(MIN_SCALE, scale * 0.85);
          slow = 0;
          resize();
        } else if (fast > 180 && scale < maxScale) {
          scale = Math.min(maxScale, scale * 1.06);
          fast = 0;
          resize();
        }
      }
      if (running) raf = requestAnimationFrame(frame);
    };

    const sync = () => {
      const should = inView && !document.hidden;
      if (should && !running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else if (!should && running) {
        running = false;
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        sync();
      },
      { rootMargin: "200px 0px" },
    );
    const ro = new ResizeObserver(resize);
    const onVisibility = () => sync();
    const onPointer = (e: PointerEvent) => {
      if (!fineMq.matches) return;
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onLost = (e: Event) => {
      e.preventDefault();
      renderer = null;
      shown = false;
      delete canvas.dataset.ready;
      setStatus("fallback");
    };
    const onRestored = () => setup();

    setup();
    io.observe(wrap);
    ro.observe(wrap);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointer, { passive: true });
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      // free every GPU object; the context itself goes with the canvas (forcing loseContext here would
      // break a remount on the same canvas, e.g. React StrictMode in development)
      renderer?.dispose();
      renderer = null;
    };
  }, [scene]);

  return (
    <div ref={wrapRef} className={cn(s.wrap, className)} data-status={status} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative poster under the canvas, sized by CSS */}
      <img src={poster} alt="" className={s.poster} decoding="async" />
      <canvas ref={canvasRef} className={s.canvas} />
    </div>
  );
}
