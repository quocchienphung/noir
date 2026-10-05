"use client";

import Link from "next/link";
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
      <header className={s.header} data-scrolled={scrolled ? "" : undefined}>
        <Link href={routes.home} className={s.home} aria-label="NOIR — home">
          <NoirWordmark />
        </Link>

        <nav className={s.nav} aria-label="Primary">
          <ul className={s.navList}>
            {primaryNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={s.navLink} aria-current={isCurrent(item.href) ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Link href={routes.contact} className={s.cta}>
          Start a project
        </Link>

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
                  <Link
                    href={item.href}
                    className={s.drawerLink}
                    aria-current={isCurrent(item.href) ? "page" : undefined}
                    onClick={close}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <Link href={routes.contact} className={s.drawerCta} onClick={close}>
            Start a project
          </Link>
        </div>
      </div>
    </>
  );
}
