"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { BlackHoleRenderer, type FrameParams } from "@/lib/noir/blackhole/renderer";
import type { Pose } from "@/lib/noir/blackhole/orbit";
import { alignmentSweep, directionNearLineOfSight, HERO_ENVIRONMENT } from "@/lib/noir/blackhole/environment";
import { cinematicFrame, diveFrame, referenceFrame, topdownFrame, type Pointer, type SceneInput } from "@/lib/noir/blackhole/scenes";
import s from "@/styles/noir/black-hole.module.css";

/** "reference" (matched to the reference video) and "topdown" are development-only QA cameras. */
export type BlackHoleScene = "dive" | "cinematic" | "reference" | "topdown";

/** Called once per animation frame; returns the (smoothed) timeline progress to render, 0…1. */
export type BlackHoleDriver = (dt: number) => number;

const MIN_SCALE = 0.32;

/**
 * Quality tiers. Integration and slab sampling are fixed per tier — never tied to the buffer size — so
 * dynamic resolution changes sharpness only, not the shape of the shadow or arcs. `budget` is the starting
 * ray-traced pixel count; adaptation then converges on the measured cost.
 */
const TIERS = {
  high: { steps: 280, slab: 40, budget: 1_600_000 },
  medium: { steps: 240, slab: 26, budget: 900_000 },
  low: { steps: 200, slab: 16, budget: 450_000 },
  ultra: { steps: 520, slab: 64, budget: 8_000_000 },
} as const;
type TierName = keyof typeof TIERS;

/**
 * Development-only QA overrides read from the URL, e.g. `/?bhT=12&bhScale=1&bhQ=ultra`:
 *   bhT      freeze the simulation clock at this time (s)   bhScale  fixed render scale (no adaptation)
 *   bhPtr=0  ignore the pointer                              bhQ      quality tier (low|medium|high|ultra)
 *   bhDebug  1 unlit density, 2 capture/escape/unresolved, 3 flow markers
 *   bhView   1 no bloom+veil, 2 radiance, 3 no veil, 4 no bloom   bhGrain=0 no grain
 *   bhAbl    ablation bitmask (TRACE_FRAG uAbl)             bhGas    gas overrides, e.g. opacity:60,thickness:0.01
 *   bhEnv    0 accepted star background (environment off), 1 force the scene's environment on
 *   bhEnvOnly=1  environment only (no gas: shadow + lensed background)
 *   bhEnvSrc offset,angle  main source at offset (rad) from the line of sight, screen angle (deg)
 *   bhEnvSweep  seconds: main source sweeps through alignment (source → arc → ring → arc → source)
 *   bhLook=prev  cinematic: the accepted (pre-closeup) look values on the current camera, for same-camera A/B
 *   bhDump=1 write the frame's camera/look parameters to canvas.dataset.frame (uniform snapshot)
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
  ablate?: number;
  gas?: Record<string, number>;
  env?: number;
  envOnly?: boolean;
  envSrc?: [number, number];
  envSweep?: number;
  dump?: boolean;
  prevLook?: boolean;
}
function readQa(): QaOverrides | null {
  if (process.env.NODE_ENV === "production") return null;
  const q = new URLSearchParams(window.location.search);
  const num = (k: string) => (q.has(k) && Number.isFinite(Number(q.get(k))) ? Number(q.get(k)) : undefined);
  const tier = q.get("bhQ");
  const gas = q.get("bhGas");
  const envSrc = q.get("bhEnvSrc")?.split(",").map(Number);
  return {
    time: num("bhT"),
    scale: num("bhScale"),
    noPointer: q.get("bhPtr") === "0",
    tier: tier && tier in TIERS ? (tier as TierName) : undefined,
    debug: num("bhDebug"),
    view: num("bhView"),
    noGrain: q.get("bhGrain") === "0",
    ablate: num("bhAbl"),
    env: num("bhEnv"),
    envOnly: q.get("bhEnvOnly") === "1",
    envSrc: envSrc && envSrc.length === 2 && envSrc.every(Number.isFinite) ? [envSrc[0], envSrc[1]] : undefined,
    envSweep: num("bhEnvSweep"),
    dump: q.get("bhDump") === "1",
    prevLook: q.get("bhLook") === "prev",
    gas: gas
      ? Object.fromEntries(
          gas
            .split(",")
            .map((kv) => kv.split(":"))
            .filter(([, v]) => Number.isFinite(Number(v)))
            .map(([k, v]) => [k, Number(v)]),
        )
      : undefined,
  };
}

/** Development-only environment overrides (see readQa). */
function applyEnvQa(qa: QaOverrides, f: FrameParams, canvas: HTMLCanvasElement) {
  if (qa.env === 0) f.environment = undefined;
  if (qa.env === 1 && !f.environment) f.environment = HERO_ENVIRONMENT;
  if (f.environment && (qa.envSrc || qa.envSweep)) {
    const sources = [...f.environment.sources];
    const eye = f.camPos;
    sources[0] = {
      ...sources[0],
      direction: qa.envSweep ? alignmentSweep(eye, f.time, qa.envSweep) : directionNearLineOfSight(eye, qa.envSrc![0], qa.envSrc![1]),
    };
    f.environment = { ...f.environment, sources };
  }
  if (qa.envOnly) f.gas = { ...f.gas, gain: 0, opacity: 0, plunge: 0 };
  if (qa.dump) {
    canvas.dataset.frame = JSON.stringify({
        camPos: f.camPos,
        basis: Array.from(f.basis),
        tanHalfFov: f.tanHalfFov,
        time: f.time,
        quality: f.quality,
        gas: f.gas,
        exposure: f.exposure,
        bloomGain: f.bloomGain,
        bloomThreshold: f.bloomThreshold,
        fade: f.fade,
        grain: f.grain,
        hueKeep: f.hueKeep,
        veil: f.veil,
        starGain: f.starGain,
      environment: f.environment ?? null,
    });
  }
}

/** Starting tier: phones and small/coarse-pointer devices start at medium, everything else high. */
function initialTier(): TierName {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return coarse || Math.min(window.screen.width, window.screen.height) < 700 ? "medium" : "high";
}

/** Starting render scale from the tier's pixel budget; adaptation then converges on the measured cost. */
function initialScale(cssW: number, cssH: number, dpr: number, tier: TierName) {
  return Math.min(1, Math.max(MIN_SCALE, Math.sqrt(TIERS[tier].budget / Math.max(1, cssW * cssH * dpr * dpr))));
}

/** Camera hook: lets one owner (the 360° explore controller) resolve the final camera each frame. */
export interface CameraHook {
  /** True while the hook owns the camera: the scroll camera then drops pointer parallax. */
  active(): boolean;
  /** Resolves the pose to render from the scroll camera's pose. */
  resolve(base: Pose, dt: number): Pose;
}

export type CanvasStatus = "init" | "live" | "fallback";

/**
 * WebGL2 black-hole canvas. Owns the one render loop: runs only while the element is near the viewport and
 * the tab is visible, follows the pointer for a slight parallax (unless a camera hook owns the camera),
 * pauses for reduced motion, recovers from context loss and frees GPU objects on unmount. If WebGL2 is
 * unavailable the poster image (rendered from this same scene) stays in place.
 *
 * Resolution: the canvas always runs at output resolution (CSS size × DPR, capped at 2); only the
 * ray-traced buffer is scaled, and the composite upsamples it with Catmull-Rom. The scale adapts to the
 * measured GPU frame time (timer query) or, without a timer, to frame cadence relative to the display's
 * refresh — with hysteresis, so it settles instead of pumping, and recovers after a slow patch.
 */
export function BlackHoleCanvas({
  scene,
  driver,
  poster,
  className,
  cameraHook,
  onStatus,
}: {
  scene: BlackHoleScene;
  driver: BlackHoleDriver;
  poster: string;
  className?: string;
  cameraHook?: { current: CameraHook | null };
  onStatus?: (s: CanvasStatus) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const driverRef = useRef(driver);
  const onStatusRef = useRef(onStatus);
  const [status, setStatus] = useState<CanvasStatus>("init");

  useEffect(() => {
    driverRef.current = driver;
    onStatusRef.current = onStatus;
  }, [driver, onStatus]);

  useEffect(() => {
    onStatusRef.current?.(status);
  }, [status]);

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
    // capped at 2: past that the composite costs more than the eye gains, and the traced buffer is adaptive
    // anyway (at DPR 3 the browser's last 1.5× upscale is bilinear, the composite's 2× is Catmull-Rom)
    const dprNow = () => Math.min(window.devicePixelRatio || 1, 2);
    const qa = readQa();
    let tier: TierName = qa?.tier ?? initialTier();
    const topTier = tier;
    const rect0 = wrap.getBoundingClientRect();
    let scale = qa?.scale ?? initialScale(rect0.width, rect0.height, dprNow(), tier);
    let aspect = 16 / 9;
    let shown = false;
    let lastKey = "";
    const pointer: Pointer = { x: 0, y: 0 };
    const target: Pointer = { x: 0, y: 0 };
    // Simulation clock for the gas: advances only while frames render (clamped dt), so a pause offscreen or
    // in a hidden tab resumes where it left off instead of jumping phase; scroll never drives it.
    let simTime = 0;

    // adaptive resolution state
    const intervals: number[] = [];
    let frames = 0;
    let lastChange = 0;
    let slowStreak = 0;

    // displayed size (includes CSS transforms, so a scaled-up frame is traced at the size it is seen)
    let shownW = 0;
    let sizeTick = 0;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      shownW = rect.width;
      aspect = rect.width / Math.max(1, rect.height);
      const dpr = dprNow();
      renderer?.resize(rect.width * dpr, rect.height * dpr, scale);
      if (renderer) {
        canvas.dataset.buffer = `${renderer.width}x${renderer.height}`;
        canvas.dataset.output = `${renderer.outWidth}x${renderer.outHeight}`;
        canvas.dataset.scale = scale.toFixed(3);
      }
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

    /** Converges the render scale on a GPU budget (or on frame cadence), with hysteresis. */
    const adapt = (now: number, dtMs: number) => {
      if (!renderer || qa?.scale !== undefined || qa?.tier) return;
      intervals.push(dtMs);
      if (intervals.length > 120) intervals.shift();
      if (++frames % 30 !== 0 || intervals.length < 30) return;
      const sorted = [...intervals].sort((a, b) => a - b);
      const vsync = sorted[Math.floor(sorted.length * 0.15)]; // ≈ the display's refresh interval
      const median = sorted[sorted.length >> 1];
      // GPU budget per frame: about 60 fps worth of work, kept ~10 % under a whole number of display
      // intervals. A flat 12 ms sat right on two 165 Hz intervals (12.1 ms), so frames slipped to three or
      // four (p95 24 ms measured). 60/120 Hz → 13 ms, 144 Hz → 12.5, 165 Hz → 10.9. (A 22 % margin cut p95
      // further but cost ~12 % linear resolution at the hero, so sharpness won.)
      const budget = Math.min(13, 0.9 * Math.max(1, Math.ceil(12 / vsync)) * vsync);
      const gpu = renderer.gpuMs();
      let ideal = scale;
      if (gpu !== null) ideal = scale * Math.sqrt(budget / Math.max(gpu, 0.5));
      else if (median > vsync * 1.35) ideal = scale * 0.88;
      else if (median < vsync * 1.08 && now - lastChange > 3000) ideal = scale * 1.06;
      ideal = Math.min(1, Math.max(MIN_SCALE, ideal));
      const rel = (ideal - scale) / scale;
      // hysteresis: shrink promptly when over budget, grow only after a calm period, ignore small steps
      const grow = rel > 0.06 && now - lastChange > 1500;
      const shrink = rel < -0.06;
      if (grow || shrink) {
        scale = ideal;
        lastChange = now;
        renderer.resetTiming();
        resize();
      }
      // tiers: drop only at the minimum scale while still over budget; climb back once there is headroom
      const over = gpu !== null ? gpu > budget * 1.25 : median > vsync * 1.35;
      slowStreak = scale <= MIN_SCALE + 1e-3 && over ? slowStreak + 1 : 0;
      if (slowStreak > 3 && tier !== "low") {
        tier = tier === "high" ? "medium" : "low";
        slowStreak = 0;
        lastChange = now;
        renderer.resetTiming();
        resize();
      } else if (tier !== topTier && scale > 0.85 && now - lastChange > 5000) {
        tier = tier === "low" ? "medium" : "high";
        lastChange = now;
        renderer.resetTiming();
        resize();
      }
    };

    const frame = (now: number) => {
      raf = 0;
      const dtMs = now - last;
      const dt = Math.min(0.1, Math.max(0.001, dtMs / 1000));
      last = now;
      const hook = cameraHook?.current ?? null;
      const owned = !!hook && hook.active();
      const k = 1 - Math.exp(-dt / 0.35);
      pointer.x += ((owned ? 0 : target.x) - pointer.x) * k;
      pointer.y += ((owned ? 0 : target.y) - pointer.y) * k;
      const progress = driverRef.current(dt);
      // A transform-driven scale (the cinematic frame opening) never fires ResizeObserver: follow the
      // displayed size, in steps of > 4 % so a continuous scale animation costs a few reallocations only.
      if (renderer && ++sizeTick % 10 === 0) {
        const w = wrap.getBoundingClientRect().width;
        if (shownW > 0 && Math.abs(w - shownW) > shownW * 0.04) resize();
      }

      if (renderer) {
        const reduced = reducedMq.matches;
        if (!reduced) simTime += dt;
        const time = qa?.time ?? (reduced ? 0 : simTime);
        // with reduced motion only re-render when the timeline or the camera actually moves
        const key = reduced && !owned ? `${progress.toFixed(4)}|${renderer.width}` : "";
        if (!reduced || owned || key !== lastKey) {
          lastKey = key;
          const { steps, slab } = TIERS[tier];
          const input: SceneInput = {
            progress,
            pointer: reduced || qa?.noPointer ? { x: 0, y: 0 } : pointer,
            time,
            aspect,
            quality: { steps, slab },
          };
          const frameParams: FrameParams =
            scene === "dive" ? diveFrame(input) : scene === "cinematic" ? cinematicFrame(input) : scene === "topdown" ? topdownFrame(input) : referenceFrame(input);
          if (hook) {
            const pose = hook.resolve({ pos: frameParams.camPos, basis: frameParams.basis, tanHalfFov: frameParams.tanHalfFov }, dt);
            frameParams.camPos = pose.pos;
            frameParams.basis = pose.basis;
            frameParams.tanHalfFov = pose.tanHalfFov;
            if (owned) frameParams.fade = 0;
          }
          if (qa?.debug !== undefined) frameParams.debug = qa.debug;
          if (qa?.view !== undefined) frameParams.view = qa.view;
          if (qa?.noGrain) frameParams.grain = 0;
          if (qa?.ablate !== undefined) frameParams.ablate = qa.ablate;
          if (qa?.gas) frameParams.gas = { ...frameParams.gas, ...qa.gas };
          if (qa?.prevLook && scene === "cinematic") Object.assign(frameParams, { exposure: 1.0, bloomGain: 0.55, bloomThreshold: 0.9, veil: 1.2 });
          if (qa) applyEnvQa(qa, frameParams, canvas);
          renderer.render(frameParams);
          if (process.env.NODE_ENV !== "production") {
            const g = renderer.gpuMs();
            if (g !== null) canvas.dataset.gpuMs = g.toFixed(2);
          }
          if (!shown) {
            shown = true;
            canvas.dataset.ready = "";
            requestAnimationFrame(() => setStatus("live"));
          }
        }
        adapt(now, dtMs);
      }
      if (running) raf = requestAnimationFrame(frame);
    };

    const sync = () => {
      const should = inView && !document.hidden;
      if (should && !running) {
        running = true;
        last = performance.now();
        intervals.length = 0; // cadence across a pause says nothing about steady-state cost
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
  }, [scene, cameraHook]);

  return (
    <div ref={wrapRef} className={cn(s.wrap, className)} data-status={status} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- decorative poster under the canvas, sized by CSS */}
      <img src={poster} alt="" className={s.poster} decoding="async" />
      <canvas ref={canvasRef} className={s.canvas} />
    </div>
  );
}
