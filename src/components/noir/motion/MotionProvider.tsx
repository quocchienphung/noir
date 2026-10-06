"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { REVEAL, REVEAL_EASE, ROLES, ROUTE, SPRING_EASE, SPRING_FALLBACK, type MotionRole } from "@/lib/noir/motion";

/**
 * Sitewide motion coordinator (renders no DOM). Owns two things:
 *
 * 1. Route transitions for every internal link that goes through <TransitionLink>:
 *    idle → exiting (page surfaces fade out, 600 ms) → awaiting-commit (router.push) → entering (fade in after
 *    300 ms, 600 ms) → idle. The fixed header never fades. Commit is detected from the committed pathname, not a
 *    timer; a timeout only restores the current page if a navigation never commits.
 * 2. Choreography of [data-m] targets inside the page surfaces (#content, footer): on route-ready, targets in view
 *    animate by role (eyebrow → heading → lead → actions, configured Aithor delays); targets below the fold reveal
 *    once when they enter the viewport. WAAPI only, compositor properties only, fill "backwards": when an
 *    animation ends nothing remains on the element (its own CSS is the final state).
 *
 * Hidden states come from motion.css (motion allowed only), with a CSS fail-safe and a <noscript> override in
 * app/layout.tsx, so content is never stuck at opacity 0 without JavaScript.
 */

type Phase = "idle" | "exiting" | "awaiting" | "entering";
/** load: direct load/reload · enter: after a coordinated transition · resume: re-subscribe (effect re-run) ·
 *  restore: Back/Forward or a navigation outside the coordinator — everything shown as it is. */
type Mode = "load" | "enter" | "resume" | "restore";

interface MotionApi {
  /** Called from Link's onNavigate. Returns true when the coordinator took over the navigation. */
  navigate: (href: string, e: { preventDefault: () => void }) => boolean;
}

const MotionContext = createContext<MotionApi | null>(null);
export const useMotion = () => useContext(MotionContext);

const reducedQuery = "(prefers-reduced-motion: reduce)";
/**
 * Page surfaces fade to 0.001, not 0 (as Aithor's appear config): at exactly 0 Chrome stops painting the subtree,
 * so the first visible frame of the fade-in had to rasterise the whole incoming page at once (measured: a 118 ms
 * frame on Home). At 0.001 nothing shows, but tiles and decoded images are ready when the fade starts.
 * Individual targets keep 0 (motion.css explains why).
 */
const HIDDEN = 0.001;
const reduced = () => window.matchMedia(reducedQuery).matches;

function surfaces(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>("[data-route-surface]")];
}

function play(el: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions): Animation | null {
  try {
    return el.animate(keyframes, options);
  } catch {
    // linear() easing unsupported: same motion with a cubic-bezier of similar shape
    try {
      return el.animate(keyframes, { ...options, easing: SPRING_FALLBACK });
    } catch {
      return null;
    }
  }
}

/** Scenes in or near view (canvases inside a page surface) have drawn their first frame, or fell back. */
function scenesReady() {
  const vh = window.innerHeight;
  return surfaces().every((s) =>
    [...s.querySelectorAll("canvas")].every((c) => {
      const r = c.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return true;
      return c.hasAttribute("data-ready") || c.closest("[data-status]")?.getAttribute("data-status") === "fallback";
    }),
  );
}

/**
 * Calls back once the incoming route is ready to be watched: its scenes have drawn (BlackHoleCanvas' own
 * data-ready) and frames flow again (three consecutive intervals under 40 ms), or after `maxWait` ms, with the
 * time waited. A route that mounts heavy work (Home's WebGL renderers compile and draw their first frame) would
 * otherwise swallow the start of a time-based fade: the animation clock runs while the main thread is blocked.
 */
function whenSmooth(cb: (waited: number) => void, maxWait = 1500) {
  const t0 = performance.now();
  let last = t0;
  let good = 0;
  let raf = requestAnimationFrame(function tick(t) {
    good = t - last < 40 ? good + 1 : 0;
    last = t;
    if ((good >= 3 && scenesReady()) || t - t0 >= maxWait) cb(t - t0);
    else raf = requestAnimationFrame(tick);
  });
  return () => cancelAnimationFrame(raf);
}

function show(el: Element) {
  el.removeAttribute("data-pending");
  el.setAttribute("data-shown", "");
}

/** Order targets inside one [data-m-group] for staggering; ungrouped targets get index 0. */
function groupIndex(list: HTMLElement[]) {
  const counts = new Map<Element | null, number>();
  return list.map((el) => {
    const g = el.parentElement?.closest("[data-m-group]") ?? null;
    const i = g ? counts.get(g) ?? 0 : 0;
    if (g) counts.set(g, i + 1);
    return Math.min(i, REVEAL.maxSteps);
  });
}

/** Targets mounted later (state changes, Back/Forward commits) are shown at once, never re-hidden. */
function watchAdditions() {
  const mo = new MutationObserver((records) => {
    for (const rec of records)
      rec.addedNodes.forEach((n) => {
        if (!(n instanceof HTMLElement)) return;
        if (n.matches("[data-m]") && !n.hasAttribute("data-pending")) show(n);
        n.querySelectorAll("[data-m]:not([data-shown]):not([data-pending])").forEach(show);
      });
  });
  surfaces().forEach((s) => mo.observe(s, { childList: true, subtree: true }));
  return () => mo.disconnect();
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const phase = useRef<Phase>("idle");
  const target = useRef<URL | null>(null);
  const routeAnims = useRef<Animation[]>([]);
  const childAnims = useRef(new Map<Element, Animation>());
  const commitTimer = useRef(0);
  const popstate = useRef(false);
  const keyboard = useRef(false);
  const lastPath = useRef<string | null>(null);
  const teardown = useRef<() => void>(() => {});

  // ------------------------------------------------------------------------------------- target choreography
  const animateIn = useCallback((el: HTMLElement, role: MotionRole, delay: number, viewport: boolean) => {
    const r = ROLES[role] ?? ROLES.block;
    // a target that holds links or buttons only fades: something people click never slides under the pointer
    const interactive = el.matches("a, button") || !!el.querySelector("a, button, input, select, textarea, summary");
    const y = interactive ? 0 : viewport ? REVEAL.y : r.y;
    const blur = viewport ? 0 : r.blur;
    const from: Keyframe = { opacity: 0, transform: y ? `translate3d(0, ${y}px, 0)` : "none" };
    const to: Keyframe = { opacity: 1, transform: "none" };
    if (blur) {
      from.filter = `blur(${blur}px)`;
      to.filter = "blur(0px)";
    }
    show(el);
    const anim = play(el, [from, to], {
      duration: viewport ? REVEAL.duration : r.duration,
      delay: Math.max(0, delay),
      easing: viewport ? REVEAL_EASE : SPRING_EASE,
      fill: "backwards",
    });
    if (!anim) return;
    childAnims.current.set(el, anim);
    const done = () => childAnims.current.delete(el);
    anim.addEventListener("finish", done);
    anim.addEventListener("cancel", done);
  }, []);

  const routeReady = useCallback(
    (mode: Mode, sinceReady = 0) => {
      teardown.current();
      const targets = surfaces().flatMap((s) => [...s.querySelectorAll<HTMLElement>("[data-m]")]);
      const motionOn = !reduced();
      if (!motionOn || mode === "restore") {
        // Back/Forward restores the page as it was read: no re-hidden content at the restored position
        targets.forEach(show);
        teardown.current = watchAdditions();
        return;
      }
      const vh = window.innerHeight;
      // one clock: the route-ready moment (client navigation) or the first paint (direct load / reload)
      const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime;
      // after a transition: time already spent waiting for the incoming route to render smoothly
      const elapsed = mode === "load" || mode === "resume" ? performance.now() - (fcp ?? 0) : sinceReady;
      const inView: HTMLElement[] = [];
      const later: HTMLElement[] = [];
      for (const el of targets) {
        // already handed to an animation or shown (resume, Strict Mode re-run): never restarted or re-hidden
        if (el.hasAttribute("data-shown")) continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) show(el);
        else if (r.bottom <= 0) show(el); // already scrolled past (restored deep position)
        else if (r.top < vh) inView.push(el);
        else later.push(el);
      }
      const idx = groupIndex(inView);
      inView.forEach((el, i) => {
        const role = (el.dataset.m as MotionRole) || "block";
        const base = ROLES[role]?.delay ?? ROLES.block.delay;
        const delay = base + idx[i] * REVEAL.entranceStagger - elapsed;
        if (delay + (ROLES[role]?.duration ?? 0) < 0) show(el);
        else animateIn(el, role, delay, false);
      });
      later.forEach((el) => {
        el.removeAttribute("data-shown");
        el.setAttribute("data-pending", "");
      });

      // viewport reveals: once per route visit; items skipped past (fast scroll, End key) appear without motion
      const io = new IntersectionObserver(
        (entries) => {
          const hits = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
          // shown meanwhile (keyboard focus, sweep): never animated again
          hits.filter((el) => el.hasAttribute("data-shown")).forEach((el) => io.unobserve(el));
          const batch = hits.filter((el) => !el.hasAttribute("data-shown"));
          if (!batch.length) return;
          batch.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
          const steps = new Map<Element | null, number>();
          batch.forEach((el) => {
            io.unobserve(el);
            const g = el.parentElement?.closest("[data-m-group]") ?? null;
            const i = steps.get(g) ?? 0;
            steps.set(g, i + 1);
            animateIn(el, (el.dataset.m as MotionRole) || "block", Math.min(i, REVEAL.maxSteps) * REVEAL.stagger, true);
          });
        },
        { rootMargin: REVEAL.rootMargin },
      );
      later.forEach((el) => io.observe(el));
      let raf = 0;
      const sweep = () => {
        raf = 0;
        const vh2 = window.innerHeight;
        const atEnd = window.scrollY + vh2 >= document.documentElement.scrollHeight - 2;
        for (const el of later) {
          if (!el.hasAttribute("data-pending")) continue;
          const r = el.getBoundingClientRect();
          // skipped past (fast scroll, End key), or the page cannot scroll any further: show without motion
          if (r.bottom <= 0 || (atEnd && r.top < vh2)) {
            io.unobserve(el);
            show(el);
          }
        }
      };
      const onScroll = () => {
        if (!raf) raf = requestAnimationFrame(sweep);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      const stopAdditions = watchAdditions();
      teardown.current = () => {
        io.disconnect();
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", onScroll);
        stopAdditions();
      };
    },
    [animateIn],
  );

  // ------------------------------------------------------------------------------------- route transitions
  const clearRoute = () => {
    routeAnims.current.forEach((a) => a.cancel());
    routeAnims.current = [];
  };

  const restorePage = useCallback(() => {
    // fail-safe: the navigation never committed — show the current page again, no stuck overlay
    window.clearTimeout(commitTimer.current);
    const els = surfaces();
    const anims = els.map((el) => play(el, [{ opacity: Number(getComputedStyle(el).opacity) }, { opacity: 1 }], { duration: 300, easing: "ease-out", fill: "forwards" }));
    clearRoute();
    routeAnims.current = anims.filter((a): a is Animation => !!a);
    Promise.all(routeAnims.current.map((a) => a.finished)).then(clearRoute, () => {});
    phase.current = "idle";
    target.current = null;
    routeReady("restore");
  }, [routeReady]);

  const push = useCallback(
    (url: URL) => {
      phase.current = "awaiting";
      window.clearTimeout(commitTimer.current);
      commitTimer.current = window.setTimeout(() => {
        if (phase.current === "awaiting") restorePage();
      }, ROUTE.commitTimeout);
      router.push(url.pathname + url.search + url.hash, { scroll: false });
    },
    [router, restorePage],
  );

  const navigate = useCallback(
    (href: string, e: { preventDefault: () => void }) => {
      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return false;
      }
      // external, same route (incl. query-only / hash-only changes) and reduced motion keep the default behaviour
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname || reduced()) return false;
      e.preventDefault();
      router.prefetch(url.pathname + url.search);
      // rapid clicks: the latest destination wins; nothing is queued
      if (phase.current === "exiting") {
        target.current = url;
        return true;
      }
      if (phase.current === "awaiting") {
        target.current = url;
        push(url);
        return true;
      }
      phase.current = "exiting";
      target.current = url;
      teardown.current();
      // stop the page's own entrance where it is, then fade the page surfaces from their current opacity
      childAnims.current.forEach((a) => a.finish());
      const els = surfaces();
      const from = els.map((el) => Number(getComputedStyle(el).opacity));
      clearRoute();
      routeAnims.current = els
        .map((el, i) => play(el, [{ opacity: from[i] }, { opacity: HIDDEN }], { duration: ROUTE.exit.duration * from[i], easing: ROUTE.exit.easing, fill: "forwards" }))
        .filter((a): a is Animation => !!a);
      Promise.all(routeAnims.current.map((a) => a.finished)).then(
        () => {
          if (phase.current === "exiting" && target.current) push(target.current);
        },
        () => {},
      );
      return true;
    },
    [router, push],
  );

  // committed route → choreography. This effect owns the observers (its cleanup tears them down), so a re-run
  // (React Strict Mode in development) resumes them instead of losing them.
  useEffect(() => {
    let mode: Mode;
    if (lastPath.current === null) mode = popstate.current ? "restore" : "load";
    else if (lastPath.current === pathname) mode = "resume";
    else if (phase.current === "awaiting" && target.current && target.current.pathname === pathname) {
      window.clearTimeout(commitTimer.current);
      const url = target.current;
      // place the destination before anything becomes visible: top (or its hash), never the old scroll offset
      const hashEl = url.hash ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
      if (hashEl) hashEl.scrollIntoView({ behavior: "instant", block: "start" });
      else window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (keyboard.current) document.getElementById("content")?.focus({ preventScroll: true });
      phase.current = "entering";
      target.current = null;
      // the outgoing fade (fill forwards) keeps the surfaces at 0 until the incoming route renders smoothly;
      // the enter delay counts from the commit, so waiting never lengthens it
      const exitAnims = routeAnims.current;
      const stopWait = whenSmooth((waited) => {
        if (phase.current !== "entering") return;
        const enter = surfaces()
          .map((el) => play(el, [{ opacity: HIDDEN }, { opacity: 1 }], { duration: ROUTE.enter.duration, delay: Math.max(0, ROUTE.enter.delay - waited), easing: ROUTE.enter.easing, fill: "both" }))
          .filter((a): a is Animation => !!a);
        // released only now that the enter animations hold opacity 0
        exitAnims.forEach((a) => a.cancel());
        routeAnims.current = enter;
        routeReady("enter", waited);
        Promise.all(enter.map((a) => a.finished)).then(
          () => {
            if (phase.current !== "entering") return;
            clearRoute();
            phase.current = "idle";
          },
          () => {},
        );
      });
      lastPath.current = pathname;
      popstate.current = false;
      return () => {
        stopWait();
        teardown.current();
      };
    } else {
      // a route change this coordinator did not start (Back/Forward, or any navigation outside TransitionLink):
      // its content was already shown on mount by the addition watcher — keep it visible, never re-hide it
      window.clearTimeout(commitTimer.current);
      clearRoute();
      phase.current = "idle";
      target.current = null;
      mode = "restore";
    }
    lastPath.current = pathname;
    popstate.current = false;
    routeReady(mode);
    return () => teardown.current();
  }, [pathname, routeReady]);

  // global listeners: Back/Forward, input modality, focus inside hidden targets, reduced-motion changes
  useEffect(() => {
    const onPop = () => {
      popstate.current = true;
      if (phase.current !== "idle") {
        window.clearTimeout(commitTimer.current);
        clearRoute();
        phase.current = "idle";
        target.current = null;
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") keyboard.current = true;
    };
    const onPointer = () => {
      keyboard.current = false;
    };
    // keyboard focus never waits for a reveal
    const onFocus = (e: FocusEvent) => {
      const t = (e.target as Element | null)?.closest?.("[data-m]");
      if (!t) return;
      const a = childAnims.current.get(t);
      if (a) a.finish();
      if (!t.hasAttribute("data-shown")) show(t);
    };
    const mq = window.matchMedia(reducedQuery);
    const onReduced = () => {
      if (!mq.matches) return;
      childAnims.current.forEach((a) => a.finish());
      surfaces().forEach((s) => s.querySelectorAll("[data-m]").forEach(show));
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("focusin", onFocus);
    mq.addEventListener("change", onReduced);
    // listeners only: running animations belong to the route they started on (a Strict Mode re-run must not
    // cancel the entrance in flight)
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("focusin", onFocus);
      mq.removeEventListener("change", onReduced);
      window.clearTimeout(commitTimer.current);
    };
  }, []);

  const api = useMemo<MotionApi>(() => ({ navigate }), [navigate]);
  return <MotionContext.Provider value={api}>{children}</MotionContext.Provider>;
}
