// One shared scroll/resize → requestAnimationFrame scheduler for every scroll-linked effect,
// so sections never attach their own listeners or trigger React renders per frame.

export interface ScrollFrame {
  scrollY: number;
  vw: number;
  vh: number;
}

type Subscriber = (frame: ScrollFrame) => void;

const subscribers = new Set<Subscriber>();
let rafId = 0;
let listening = false;

function readFrame(): ScrollFrame {
  return { scrollY: window.scrollY, vw: window.innerWidth, vh: window.innerHeight };
}

function flush() {
  rafId = 0;
  const frame = readFrame();
  subscribers.forEach((fn) => fn(frame));
}

function schedule() {
  if (!rafId) rafId = requestAnimationFrame(flush);
}

export function subscribeScroll(fn: Subscriber): () => void {
  subscribers.add(fn);
  if (!listening) {
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    listening = true;
  }
  // Run once immediately so initial state is correct before the first scroll.
  fn(readFrame());
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0 && listening) {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      listening = false;
    }
  };
}

/** Re-run all subscribers on the next frame (after layout changes such as accordion toggles). */
export function requestScrollFrame() {
  if (typeof window !== "undefined") schedule();
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Document-relative top of an element, independent of current transforms on ancestors we control. */
export function pageTop(el: Element): number {
  return el.getBoundingClientRect().top + window.scrollY;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
