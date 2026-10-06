"use client";

import { TransitionLink } from "../motion/TransitionLink";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { primaryNav, routes } from "@/data/noir/site";
import { NoirWordmark } from "../brand";
import s from "@/styles/noir/header.module.css";

/**
 * Fixed header: wordmark (always visible, always links home), inline nav on tablet/desktop and a
 * drawer on phones. Gains a dark glass background once the page has scrolled. The drawer traps focus,
 * closes on Escape/route change and returns focus to its trigger.
 */
export function NoirHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  // Close the drawer on navigation (adjusting state during render rather than in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      setScrolled(window.scrollY > 24);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  // denser glass while the header strip is over a light section (contrast of the nav links); dark sections unchanged
  const [onLight, setOnLight] = useState(false);
  useEffect(() => {
    const targets = [...document.querySelectorAll('[data-header-surface="light"]')];
    if (!targets.length) {
      queueMicrotask(() => setOnLight(false));
      return;
    }
    const over = new Set<Element>();
    let io: IntersectionObserver | null = null;
    const observe = () => {
      io?.disconnect();
      const h = headerRef.current?.offsetHeight || 72;
      // only the strip under the fixed header counts
      io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) over.add(e.target);
            else over.delete(e.target);
          }
          setOnLight(over.size > 0);
        },
        { rootMargin: `0px 0px -${Math.max(0, window.innerHeight - h)}px 0px` },
      );
      targets.forEach((t) => io?.observe(t));
    };
    observe();
    window.addEventListener("resize", observe);
    return () => {
      io?.disconnect();
      window.removeEventListener("resize", observe);
    };
  }, [pathname]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      if (wasOpen.current) buttonRef.current?.focus({ preventScroll: true });
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const panel = panelRef.current;
    const focusables = () => [...(panel?.querySelectorAll<HTMLElement>("a[href], button") ?? [])];
    focusables()[0]?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === "Tab") {
        const items = focusables();
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const mq = window.matchMedia("(min-width: 810px)");
    const onWide = () => mq.matches && setOpen(false);
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    mq.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onWide);
      root.style.overflow = prev;
    };
  }, [open]);

  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <header ref={headerRef} className={s.header} data-scrolled={scrolled ? "" : undefined} data-surface={onLight ? "light" : undefined}>
        <TransitionLink href={routes.home} className={s.home} aria-label="NOIR — home">
          <NoirWordmark />
        </TransitionLink>

        <nav className={s.nav} aria-label="Primary">
          <ul className={s.navList}>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <TransitionLink href={item.href} className={s.navLink} aria-current={isCurrent(item.href) ? "page" : undefined}>
                  {item.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>

        <TransitionLink href={routes.contact} className={s.cta}>
          Start a project
        </TransitionLink>

        <button
          ref={buttonRef}
          type="button"
          className={s.menuButton}
          aria-expanded={open}
          aria-controls="noir-menu"
          onClick={() => setOpen(true)}
        >
          Menu
          <span className={s.menuIcon} aria-hidden="true" />
        </button>
      </header>

      <div id="noir-menu" className={s.overlay} data-open={open ? "" : undefined} inert={!open}>
        <div className={s.backdrop} onClick={close} aria-hidden="true" />
        <div ref={panelRef} className={s.panel} role="dialog" aria-modal="true" aria-label="Site menu">
          <button type="button" className={s.close} onClick={close}>
            Close
          </button>
          <nav aria-label="Menu">
            <ul className={s.drawerList}>
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <TransitionLink
                    href={item.href}
                    className={s.drawerLink}
                    aria-current={isCurrent(item.href) ? "page" : undefined}
                    onClick={close}
                  >
                    {item.label}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>
          <TransitionLink href={routes.contact} className={s.drawerCta} onClick={close}>
            Start a project
          </TransitionLink>
        </div>
      </div>
    </>
  );
}
