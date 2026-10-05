"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { BlackHoleRenderer, type FrameParams } from "@/lib/noir/blackhole/renderer";
import { cinematicFrame, diveFrame, referenceFrame, type Pointer, type SceneInput } from "@/lib/noir/blackhole/scenes";
import s from "@/styles/noir/black-hole.module.css";

/** "reference" is the development-only QA camera matched to the reference video. */
export type BlackHoleScene = "dive" | "cinematic" | "reference";

/** Called once per animation frame; returns the (smoothed) timeline progress to render, 0…1. */
export type BlackHoleDriver = (dt: number) => number;

const MIN_SCALE = 0.32;

/**
 * Quality tiers. Integration and slab sampling are fixed per tier — never tied to the buffer size — so
 * dynamic resolution changes sharpness only, not the shape of the shadow or arcs. `budget` is the
 * ray-traced pixels per frame we aim for before adaptive resolution kicks in.
 */
const TIERS = {
  high: { steps: 280, slab: 28, budget: 1_000_000 },
  medium: { steps: 240, slab: 16, budget: 620_000 },
  low: { steps: 200, slab: 10, budget: 380_000 },
  ultra: { steps: 520, slab: 64, budget: 8_000_000 },
} as const;
type TierName = keyof typeof TIERS;

/**
 * Development-only QA overrides read from the URL, e.g. `/?bhT=12&bhScale=1&bhQ=ultra`:
 *   bhT      freeze the simulation clock at this time (s)   bhScale  fixed render scale (no adaptation)
 *   bhPtr=0  ignore the pointer                              bhQ      quality tier (low|medium|high|ultra)
 *   bhDebug  1 unlit density, 2 capture/escape/unresolved, 3 flow markers
 *   bhView   1 no bloom, 2 false-colour radiance              bhGrain=0 no grain
 * `process.env.NODE_ENV` is inlined at build time, so production bundles drop this entirely.
 */
interface QaOverrides {
  time?: number;
  scale?: number;
  noPointer?: boolean;
  tier?: TierName;
  debug?: number;
  view?: number;
  noGrain?: boolean;
}
function readQa(): QaOverrides | null {
  if (process.env.NODE_ENV === "production") return null;
  const q = new URLSearchParams(window.location.search);
  const num = (k: string) => (q.has(k) && Number.isFinite(Number(q.get(k))) ? Number(q.get(k)) : undefined);
  const tier = q.get("bhQ");
  return {
    time: num("bhT"),
    scale: num("bhScale"),
    noPointer: q.get("bhPtr") === "0",
    tier: tier && tier in TIERS ? (tier as TierName) : undefined,
    debug: num("bhDebug"),
    view: num("bhView"),
    noGrain: q.get("bhGrain") === "0",
  };
}

/** Starting tier: phones and small/coarse-pointer devices start at medium, everything else high. */
function initialTier(): TierName {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return coarse || Math.min(window.screen.width, window.screen.height) < 700 ? "medium" : "high";
}

/** Render scale from the tier's pixel budget (small canvases render near-native). */
function initialScale(cssW: number, cssH: number, dpr: number, tier: TierName) {
  return Math.min(1, Math.max(MIN_SCALE, Math.sqrt(TIERS[tier].budget / Math.max(1, cssW * cssH * dpr * dpr))));
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
    const qa = readQa();
    let tier: TierName = qa?.tier ?? initialTier();
    let scale = qa?.scale ?? initialScale(rect0.width, rect0.height, dprNow(), tier);
    let maxScale = scale;
    let ema = 16;
    let slow = 0;
    let fast = 0;
    let aspect = 16 / 9;
    let shown = false;
    let lastKey = "";
    const pointer: Pointer = { x: 0, y: 0 };
    const target: Pointer = { x: 0, y: 0 };
    // Simulation clock for the gas: advances only while frames render (clamped dt), so a pause offscreen or
    // in a hidden tab resumes where it left off instead of jumping phase; scroll never drives it.
    let simTime = 0;

    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      aspect = rect.width / Math.max(1, rect.height);
      const dpr = dprNow();
      maxScale = qa?.scale ?? initialScale(rect.width, rect.height, dpr, tier);
      scale = Math.min(scale, maxScale);
      renderer?.resize(rect.width * dpr * scale, rect.height * dpr * scale);
      if (renderer) canvas.dataset.buffer = `${renderer.width}x${renderer.height}`;
      canvas.dataset.tier = tier;
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
        if (!reduced) simTime += dt;
        const time = qa?.time ?? (reduced ? 0 : simTime);
        // with reduced motion only re-render when the timeline actually moves
        const key = reduced ? `${progress.toFixed(4)}|${renderer.width}` : "";
        if (!reduced || key !== lastKey) {
          lastKey = key;
          const { steps, slab } = TIERS[tier];
          const input: SceneInput = {
            progress,
            pointer: reduced || qa?.noPointer ? { x: 0, y: 0 } : pointer,
            time,
            aspect,
            quality: { steps, slab },
          };
          const frameParams: FrameParams = scene === "dive" ? diveFrame(input) : scene === "cinematic" ? cinematicFrame(input) : referenceFrame(input);
          if (qa?.debug !== undefined) frameParams.debug = qa.debug;
          if (qa?.view !== undefined) frameParams.view = qa.view;
          if (qa?.noGrain) frameParams.grain = 0;
          renderer.render(frameParams);
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
        if (qa?.scale !== undefined || qa?.tier) {
          // fixed QA scale/tier: no adaptation
        } else if (slow > 30 && scale > MIN_SCALE) {
          scale = Math.max(MIN_SCALE, scale * 0.85);
          slow = 0;
          resize();
        } else if (slow > 30 && tier !== "low") {
          // already at the minimum resolution: drop a tier (fewer steps/samples, same model and motion)
          tier = tier === "high" ? "medium" : "low";
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
