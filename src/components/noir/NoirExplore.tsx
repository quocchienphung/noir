"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { ExploreMode, OrbitController } from "@/lib/noir/blackhole/orbit";
import s from "@/styles/noir/explore.module.css";

/** Drag sensitivity: dragging across the full viewport height turns the camera by ~1.15π. */
const RAD_PER_VIEWPORT = Math.PI * 1.15;
const KEY_STEP = (8 * Math.PI) / 180;
const DRAG_THRESHOLD = 5; // CSS px before a mouse press on the media becomes a drag

/**
 * 360° explore controls for the hero. Input listeners only update the orbit controller (no React state
 * per move); React state changes only on mode transitions (enter/exit), in NoirIntro.
 *
 * - Entry: the "Explore 360°" button, a click/tap on the scene media, or (mouse) a drag that starts on
 *   the media. Links, buttons and text keep their own behaviour; touch scrolling is untouched until the
 *   user taps to enter.
 * - Orbit: a dedicated surface with `touch-action: none`, pointer capture, arrow keys, Reset and Close.
 * - Exit: Close, Escape, mouse wheel or any page scroll — the camera blends back to the live scroll pose.
 */
export function NoirExplore({
  ctrl,
  mediaRef,
  mode,
  available,
}: {
  ctrl: OrbitController;
  mediaRef: RefObject<HTMLElement | null>;
  mode: ExploreMode;
  /** WebGL live and the hero still at its opening: entry is offered only then. */
  available: boolean;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLButtonElement>(null);
  const exploring = mode === "entering" || mode === "orbit";
  const availableRef = useRef(available);
  useEffect(() => {
    availableRef.current = available;
  }, [available]);

  // entry from the media itself (scroll mode)
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    let press: { id: number; x: number; y: number; t: number; type: string } | null = null;
    let dragging = false;
    const interactive = (e: PointerEvent) => !!(e.target as Element | null)?.closest("a, button, input, textarea, select, [data-explore-ignore]");
    const onDown = (e: PointerEvent) => {
      if (ctrl.active || !availableRef.current || e.button !== 0 || interactive(e)) return;
      press = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), type: e.pointerType };
      dragging = false;
    };
    const onMove = (e: PointerEvent) => {
      if (!press || e.pointerId !== press.id) return;
      const dx = e.clientX - press.x;
      const dy = e.clientY - press.y;
      if (press.type !== "mouse") {
        // touch/pen: any real movement is a page scroll, not an entry
        if (Math.hypot(dx, dy) > 10) press = null;
        return;
      }
      if (!dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        dragging = true;
        window.dispatchEvent(new CustomEvent("noir-explore-enter", { detail: { drag: true } }));
        ctrl.dragStart();
        media.setPointerCapture?.(e.pointerId);
      }
      if (dragging) {
        const k = RAD_PER_VIEWPORT / window.innerHeight;
        ctrl.rotate(-e.movementX * k, -e.movementY * k, 1 / 60);
      }
    };
    const onUp = (e: PointerEvent) => {
      if (!press || e.pointerId !== press.id) return;
      const tap = !dragging && performance.now() - press.t < 600;
      if (dragging) ctrl.dragEnd();
      else if (tap) window.dispatchEvent(new CustomEvent("noir-explore-enter", { detail: { drag: false } }));
      press = null;
      dragging = false;
    };
    const onCancel = () => {
      if (dragging) ctrl.dragCancel();
      press = null;
      dragging = false;
    };
    media.addEventListener("pointerdown", onDown);
    media.addEventListener("pointermove", onMove);
    media.addEventListener("pointerup", onUp);
    media.addEventListener("pointercancel", onCancel);
    media.addEventListener("lostpointercapture", onCancel);
    return () => {
      media.removeEventListener("pointerdown", onDown);
      media.removeEventListener("pointermove", onMove);
      media.removeEventListener("pointerup", onUp);
      media.removeEventListener("pointercancel", onCancel);
      media.removeEventListener("lostpointercapture", onCancel);
    };
  }, [ctrl, mediaRef]);

  // orbit surface: drag, keys, exits
  useEffect(() => {
    if (!exploring) return;
    const surface = surfaceRef.current;
    if (!surface) return;
    surface.focus({ preventScroll: true });
    let drag: { id: number; lastT: number } | null = null;
    const startY = window.scrollY;

    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest("button")) return;
      if (drag) return; // one pointer drives the camera; extra fingers are ignored
      drag = { id: e.pointerId, lastT: performance.now() };
      surface.setPointerCapture(e.pointerId);
      ctrl.dragStart();
      e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const now = performance.now();
      const dt = Math.max(1 / 240, (now - drag.lastT) / 1000);
      drag.lastT = now;
      const k = RAD_PER_VIEWPORT / window.innerHeight;
      ctrl.rotate(-e.movementX * k, -e.movementY * k, dt);
    };
    const end = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      ctrl.dragEnd();
    };
    // aborted gestures (pointercancel, lost capture, blur, hidden tab) stop without an inertial coast
    const cancelDrag = () => {
      if (!drag) return;
      drag = null;
      ctrl.dragCancel();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        ctrl.exit();
        return;
      }
      if (document.activeElement !== surface) return;
      const map: Record<string, [number, number]> = {
        ArrowLeft: [KEY_STEP, 0],
        ArrowRight: [-KEY_STEP, 0],
        ArrowUp: [0, KEY_STEP],
        ArrowDown: [0, -KEY_STEP],
      };
      const d = map[e.key];
      if (d) {
        e.preventDefault();
        ctrl.rotate(d[0], d[1], 0);
      }
    };
    // wheel or a real page scroll means "carry on down the page": hand the camera back
    const onWheel = () => ctrl.exit();
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > 4) ctrl.exit();
    };
    const onBlur = () => cancelDrag();

    surface.addEventListener("pointerdown", onDown);
    surface.addEventListener("pointermove", onMove);
    surface.addEventListener("pointerup", end);
    surface.addEventListener("pointercancel", cancelDrag);
    surface.addEventListener("lostpointercapture", cancelDrag);
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onBlur);
    return () => {
      surface.removeEventListener("pointerdown", onDown);
      surface.removeEventListener("pointermove", onMove);
      surface.removeEventListener("pointerup", end);
      surface.removeEventListener("pointercancel", cancelDrag);
      surface.removeEventListener("lostpointercapture", cancelDrag);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onBlur);
      cancelDrag();
    };
  }, [exploring, ctrl]);

  // return focus to the entry button after leaving
  const wasExploring = useRef(false);
  useEffect(() => {
    if (exploring) wasExploring.current = true;
    else if (wasExploring.current && mode === "scroll") {
      wasExploring.current = false;
      if (document.activeElement === document.body || surfaceRef.current?.contains(document.activeElement)) openRef.current?.focus({ preventScroll: true });
    }
  }, [exploring, mode]);

  return (
    <>
      <button
        ref={openRef}
        type="button"
        className={s.open}
        data-hidden={!available || exploring ? "" : undefined}
        onClick={() => window.dispatchEvent(new CustomEvent("noir-explore-enter", { detail: { drag: false } }))}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className={s.icon}>
          <ellipse cx="10" cy="10" rx="8" ry="3.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="10" cy="10" r="2.6" fill="currentColor" />
          <path d="M15.5 4.5l1.6 1.7-2.2.6" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        Explore 360°
      </button>

      <div
        ref={surfaceRef}
        className={s.surface}
        data-active={exploring ? "" : undefined}
        tabIndex={exploring ? 0 : -1}
        role="group"
        aria-roledescription="3D view"
        aria-label="Black hole, 360° view. Drag or use the arrow keys to rotate; Escape to return."
        hidden={!exploring}
      >
        <div className={s.bar}>
          <p className={s.hint} aria-hidden="true">
            Drag to rotate · Esc to exit
          </p>
          <button type="button" className={s.btn} onClick={() => ctrl.reset()}>
            Reset view
          </button>
          <button type="button" className={s.btn} onClick={() => ctrl.exit()} aria-label="Close 360° view">
            Close
            <svg viewBox="0 0 16 16" aria-hidden="true" className={s.x}>
              <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
