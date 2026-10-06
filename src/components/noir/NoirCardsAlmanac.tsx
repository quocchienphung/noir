"use client";

import Image from "next/image";
import { TransitionLink } from "./motion/TransitionLink";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent } from "react";
import { cardsAlmanac, type AlmanacCard } from "@/data/noir/cards-almanac";
import { intro } from "@/data/noir/intro";
import { home } from "@/data/noir/site";
import { STACK, stackFrames, type CardFrame, type CardMeasure } from "@/lib/noir/cards-almanac/stack";
import { AlmanacDetails } from "./AlmanacDetails";
import s from "@/styles/noir/cards-almanac.module.css";

const C = home.capabilities;
/** Glide time constant (s): after each scroll step the cards ease into place over ≈ 3τ instead of jumping. */
const GLIDE_TAU = 0.14;
/** Same condition as the stack media query in cards-almanac.module.css. */
const STACK_QUERY = "(min-width: 900px) and (min-height: 620px) and (prefers-reduced-motion: no-preference)";

/**
 * Development-only fixtures (never in production builds, never presented as real work):
 *   ?almanacFixture=6  six cards (three labelled dev fixtures) + a live and a link-only demo slot on the open slot
 *   ?almanacFixture=1  one card       ?almanacFixture=0  no cards
 */
function devFixture(): readonly AlmanacCard[] | null {
  if (process.env.NODE_ENV === "production") return null;
  const v = new URLSearchParams(window.location.search).get("almanacFixture");
  if (v === null) return null;
  const n = Math.max(0, Math.min(12, Number(v) || 0));
  const base = cardsAlmanac.cards.map((c) =>
    c.id !== "open-slot"
      ? c
      : {
          ...c,
          sections: c.sections.map((x, i) =>
            i === 0
              ? { id: x.id, label: x.label, sectionAnchor: null, readiness: "live" as const, liveUrl: "/qa/embed-fixture", previewAsset: null, description: "Dev fixture: a local test page, not a project demo.", embeddable: true, sandbox: null }
              : i === 1
                ? { id: x.id, label: x.label, sectionAnchor: "#pricing", readiness: "live" as const, liveUrl: "/qa/embed-fixture", previewAsset: null, description: "Dev fixture: link-only policy (embeddable: false).", embeddable: false, sandbox: null }
                : x,
          ),
        },
  );
  const extra: AlmanacCard[] = Array.from({ length: Math.max(0, n - base.length) }, (_, i) => ({
    id: `dev-fixture-${i + 1}`,
    kind: "fixture",
    title: `Dev fixture ${i + 1}`,
    meta: "Dev fixture · not a project",
    year: null,
    category: "Fixture",
    description: "A test card for stack scalability. It exists only in development builds and is not a project.",
    cover: null,
    placeholder: { label: "Dev fixture", hue: (60 + i * 97) % 360 },
    link: null,
    stack: [],
    sections: [],
    sourceExperimentId: null,
  }));
  return [...base, ...extra].slice(0, n);
}

/**
 * Cards Almanac: the capabilities introduction and the project cards, between the intro and Complexity.
 * Recreates the public GetLayers "Cards Almanac" stack in HTML/CSS: each card pins one band below the previous
 * (CSS sticky, native scrolling); the controller only maps measured positions to the covered cards' recession,
 * the incoming card's lean, cover zoom and copy fade (lib/noir/cards-almanac/stack.ts), and draws every card at a
 * time-smoothed position so it glides after each wheel step and eases into its pin. Small screens and reduced
 * motion get a stable reading list. All content is server-rendered.
 */
export function NoirCardsAlmanac() {
  const [cards, setCards] = useState<readonly AlmanacCard[]>(cardsAlmanac.cards);
  const [canStack, setCanStack] = useState(true);
  const [fits, setFits] = useState(true);
  const [open, setOpen] = useState<AlmanacCard | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const framesRef = useRef<CardFrame[]>([]);
  const flow = !canStack || !fits;
  const flowRef = useRef(flow);

  // ------------------------------------------------------------------------------------------ preferences
  useEffect(() => {
    const fx = devFixture();
    const mq = window.matchMedia(STACK_QUERY);
    const sync = () => setCanStack(mq.matches);
    // one batched update after hydration (fixture, media)
    queueMicrotask(() => {
      if (fx) setCards(fx);
      sync();
    });
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  /** Index of the card the reader is on: the front of the stack, or the first card under the header in flow. */
  const readingIndex = useCallback(() => {
    const list = listRef.current;
    if (!list) return null;
    const items = [...list.children] as HTMLElement[];
    if (!items.length) return null;
    if (!flowRef.current) {
      const f = framesRef.current;
      let k = 0;
      for (let i = 0; i < f.length; i++) if (f[i].progress >= 0.5) k = i;
      return k;
    }
    const line = innerHeight * 0.35;
    let k = 0;
    items.forEach((li, i) => {
      if (li.getBoundingClientRect().top <= line) k = i;
    });
    return k;
  }, []);

  /** Scroll so card i is the readable front card (stack) or sits under the header (flow). */
  const reveal = useCallback((i: number) => {
    const list = listRef.current;
    const li = list?.children[i] as HTMLElement | undefined;
    if (!list || !li) return;
    if (flowRef.current) {
      const header = parseFloat(getComputedStyle(li).scrollMarginTop) || 96;
      window.scrollTo({ top: Math.round(li.getBoundingClientRect().top + scrollY - header), behavior: "instant" });
      return;
    }
    // natural (unstuck) document top of slot i: list top + i slot pitches (later slots carry the spacing as margin-top)
    const first = list.children[0] as HTMLElement;
    const second = list.children[1] as HTMLElement | undefined;
    const pitch = first.offsetHeight + (second ? parseFloat(getComputedStyle(second).marginTop) || 0 : 0);
    const pinned = parseFloat(getComputedStyle(li).top) || 0;
    const top = list.getBoundingClientRect().top + scrollY + i * pitch - pinned;
    window.scrollTo({ top: Math.round(top + 1), behavior: "instant" });
  }, []);

  // keep the reading position when the layout mode changes (resize across the breakpoint)
  useLayoutEffect(() => {
    if (flowRef.current === flow) return;
    const anchor = readingIndex();
    flowRef.current = flow;
    if (anchor !== null && sectionRef.current) {
      const r = sectionRef.current.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) reveal(anchor);
    }
  }, [flow, readingIndex, reveal]);

  // ------------------------------------------------------------------------------------------ stack motion
  useEffect(() => {
    const section = sectionRef.current;
    const list = listRef.current;
    if (!section || !list || flow) return;
    const items = [...list.children] as HTMLElement[];
    const n = items.length;
    if (!n) return;
    const parts = items.map((li) => ({
      card: li.querySelector<HTMLElement>("[data-card]"),
      zoom: li.querySelector<HTMLElement>("[data-zoom]"),
      copy: li.querySelector<HTMLElement>("[data-copy]"),
    }));
    let pinned: number[] = [];
    let band = 0;
    let vh = innerHeight;
    let raf = 0;
    let visible = false;
    // glide state: where each card is drawn (eased toward its layout position), and the last frame time
    const drawn = new Array<number>(n).fill(0);
    let primed = false;
    let lastT = 0;
    const measures: CardMeasure[] = items.map(() => ({ remaining: 0, visual: 0, range: 1 }));

    const measure = () => {
      vh = innerHeight;
      pinned = items.map((li) => parseFloat(getComputedStyle(li).top) || 0);
      band = n > 1 ? pinned[1] - pinned[0] : 0;
      // a card taller than the room under the header (long copy, big text) → stable list instead
      const room = vh - pinned[0] - Math.min(n - 1, STACK.cap) * band - 8;
      const tallest = Math.max(...items.map((li) => li.offsetHeight));
      setFits(tallest <= room);
    };
    const frame = () => {
      raf = 0;
      const now = performance.now();
      // frame-rate independent easing; dt clamped so a background tab or a stall never overshoots
      const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 60;
      lastT = now;
      const k = 1 - Math.exp(-dt / GLIDE_TAU);
      let moving = false;
      // read everything, then write (transforms do not invalidate layout)
      for (let i = 0; i < n; i++) {
        const r = items[i].getBoundingClientRect().top - pinned[i];
        let v = drawn[i];
        // first frame, or a jump of more than a viewport (Home/End, anchor, scrollbar drag): no glide across it
        if (!primed || Math.abs(r - v) > vh) v = r;
        else v += (r - v) * k;
        if (Math.abs(r - v) < 0.25) v = r;
        else moving = true;
        drawn[i] = v;
        measures[i].remaining = r;
        measures[i].visual = v;
        measures[i].range = Math.max(1, vh - pinned[i]);
      }
      primed = true;
      const f = stackFrames(measures, band, framesRef.current);
      for (let i = 0; i < n; i++) {
        const p = parts[i];
        const fr = f[i];
        if (p.card) {
          p.card.style.transform = `translate3d(0, ${fr.translateY.toFixed(2)}px, 0) rotateX(${fr.rotateX.toFixed(3)}deg) scale(${fr.scale.toFixed(4)})`;
          p.card.style.setProperty("--shade", fr.shade.toFixed(3));
        }
        if (p.zoom) p.zoom.style.transform = `scale(${fr.coverScale.toFixed(4)})`;
        if (p.copy) p.copy.style.opacity = fr.copyOpacity < 1 ? fr.copyOpacity.toFixed(3) : "";
      }
      list.dataset.front = String(f.reduce((front, fr, i) => (fr.progress >= 0.5 ? i : front), 0));
      // keep animating only while a card is still gliding; at rest no frame is scheduled
      if (moving && visible) {
        list.dataset.moving = "";
        raf = requestAnimationFrame(frame);
      } else {
        delete list.dataset.moving;
        lastT = 0;
      }
    };
    const schedule = () => {
      if (visible && !raf) raf = requestAnimationFrame(frame);
    };
    const onResize = () => {
      measure();
      schedule();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) schedule();
        else primed = false; // re-enter without gliding from a stale position
      },
      { rootMargin: "50% 0px" },
    );
    measure();
    // first frame synchronously: no flash of untransformed cards when the section mounts in view
    frame();
    io.observe(section);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(list);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      for (const p of parts) {
        for (const el of [p.card, p.zoom, p.copy]) {
          if (!el) continue;
          el.style.transform = "";
          el.style.opacity = "";
        }
        p.card?.style.removeProperty("--shade");
      }
      delete list.dataset.front;
      delete list.dataset.moving;
      framesRef.current = [];
    };
  }, [flow, cards]);

  // re-check the fit after leaving flow because of it (e.g. the window grew)
  useEffect(() => {
    if (fits) return;
    const onResize = () => setFits(true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [fits]);

  // a deep link to a card (#card-<id>) lands on that card as the readable front
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const i = cards.findIndex((c) => `card-${c.id}` === id);
    if (i >= 0) requestAnimationFrame(() => reveal(i));
  }, [cards, reveal]);

  /** Keyboard focus inside a covered card brings that card to the front instead of leaving it occluded. */
  const onFocus = (e: FocusEvent<HTMLOListElement>) => {
    if (flowRef.current) return;
    const li = (e.target as HTMLElement).closest<HTMLElement>("[data-index]");
    if (!li) return;
    const i = Number(li.dataset.index);
    const f = framesRef.current[i];
    if (f && f.progress > 0.98 && f.depth < 0.05) return;
    requestAnimationFrame(() => reveal(i));
  };

  const capEff = Math.min(Math.max(cards.length - 1, 0), STACK.cap);

  return (
    <section ref={sectionRef} id="work" className={s.section} aria-labelledby="noir-capabilities-title" data-flow={flow ? "" : undefined} data-header-surface="light">
      <div className={s.inner}>
        {/* capabilities: the page's one copy of home.capabilities, as the stack's editorial introduction */}
        {/* static introduction: sitewide viewport reveal; the card stack below keeps its own scroll controller */}
        <header className={s.intro} data-m-group="">
          <p className={s.eyebrow} data-m="eyebrow">
            {C.eyebrow}
          </p>
          <h2 id="noir-capabilities-title" className={s.title} data-m="block">
            {C.title}
          </h2>
          <p className={s.lede} data-m="block">
            {C.body}
          </p>
          <ul className={s.pillars} aria-label="Capabilities" data-m="block">
            {C.pillars.map((pillar, i) => (
              <li key={pillar} className={s.pillar}>
                <span className={s.pillarIndex}>{String(i + 1).padStart(2, "0")}</span>
                {pillar}
              </li>
            ))}
          </ul>
          <div className={s.actions} data-m="block">
            <TransitionLink href={intro.primaryCta.href} className={s.action}>
              {intro.primaryCta.label}
            </TransitionLink>
            <TransitionLink href={intro.secondaryCta.href} className={s.actionGhost}>
              {intro.secondaryCta.label}
            </TransitionLink>
          </div>
        </header>

        {cards.length ? (
          <>
            <div className={s.toolbar}>
              <p className={s.note} data-m="block">
                {cardsAlmanac.note}
              </p>
            </div>
            <ol ref={listRef} className={s.list} aria-label={cardsAlmanac.listLabel} style={{ "--cap-eff": capEff } as CSSProperties} onFocus={onFocus}>
              {cards.map((card, i) => (
                <li key={card.id} id={`card-${card.id}`} className={s.slot} data-index={i} style={{ "--slot": Math.min(i, STACK.cap) } as CSSProperties}>
                  <AlmanacCardView card={card} first={i === 0} onOpen={() => setOpen(card)} />
                </li>
              ))}
            </ol>
          </>
        ) : null}
      </div>
      <AlmanacDetails card={open} onClose={() => setOpen(null)} />
    </section>
  );
}

function AlmanacCardView({ card, first, onOpen }: { card: AlmanacCard; first: boolean; onOpen: () => void }) {
  const titleId = `card-${card.id}-title`;
  return (
    <article className={s.card} data-card="" aria-labelledby={titleId}>
      <div className={s.cover}>
        <div className={s.coverZoom} data-zoom="">
          {card.cover ? (
            <Image
              className={s.coverImg}
              data-fit={card.cover.fit}
              src={card.cover.src}
              alt={card.cover.alt}
              fill
              sizes="(min-width: 900px) 32vw, (min-width: 700px) 40vw, 100vw"
              style={{ objectPosition: card.cover.position }}
              loading={first ? "eager" : "lazy"}
              fetchPriority={first ? "high" : "auto"}
            />
          ) : (
            <div className={s.placeholder} style={{ "--hue": card.placeholder.hue } as CSSProperties} role="img" aria-label={`${card.placeholder.label} — placeholder colour field, not a screenshot`}>
              <span className={s.placeholderLabel} aria-hidden="true">
                {card.placeholder.label}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className={s.copy} data-copy="">
        <p className={s.meta}>{card.meta}</p>
        <h3 id={titleId} className={s.cardTitle}>
          {card.title}
        </h3>
        <p className={s.desc}>{card.description}</p>
        <div className={s.footer}>
          <span className={s.pill}>{card.category}</span>
          <button type="button" className={s.plus} aria-label={`View details for ${card.title}`} aria-haspopup="dialog" onClick={onOpen}>
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
