"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { menuLinks } from "@/data/sites/norda-framer-website-3f1ea7cb/navigation";
import { subscribeScroll } from "@/lib/sites/norda-framer-website-3f1ea7cb/scroll";
import { CHROME_REVEAL_ATTR } from "@/lib/sites/norda-framer-website-3f1ea7cb/chrome";
import { LogoMark, PlusMarker } from "./icons";
import { RollText } from "./RollText";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/chrome.module.css";


/**
 * Fixed logo + MENU trigger and the right-hand drawer menu.
 * MEASURED: over a hero the MENU label is plain white and the fixed logo hidden (the hero carries its
 * own logo); once the page's light content reaches the viewport top both switch to the
 * mix-blend-mode: difference versions. Pages without a hero start in the blended state.
 */
export function SiteChrome() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(true);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  // Track the reveal marker for the current route (absent marker → blended from the start).
  useEffect(
    () =>
      subscribeScroll(() => {
        const marker = document.querySelector(`[${CHROME_REVEAL_ATTR}]`);
        setRevealed(!marker || marker.getBoundingClientRect().top <= 1);
      }),
    [pathname],
  );

  // Close the drawer whenever the route changes (state adjusted during render, not in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const close = useCallback(() => setOpen(false), []);

  // Escape, focus trap, focus return, scroll lock.
  useEffect(() => {
    if (!open) {
      if (wasOpen.current) menuButtonRef.current?.focus({ preventScroll: true });
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
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <div className={cn(s.logo, revealed && s.logoVisible)}>
        <Link href="/" aria-label="Nordå — home" tabIndex={revealed ? 0 : -1} className={s.logoLink}>
          <LogoMark className={s.logoMark} />
        </Link>
      </div>

      <button
        ref={menuButtonRef}
        type="button"
        className={cn(s.menuButton, revealed && s.menuButtonBlend)}
        aria-expanded={open}
        aria-controls="nd-menu"
        onClick={() => setOpen(true)}
      >
        <span className={s.menuRise}>
          <RollText text="MENU" className={s.menuLabel} />
        </span>
      </button>

      <div id="nd-menu" className={s.overlay} data-open={open ? "" : undefined} inert={!open} aria-hidden={!open}>
        <div className={s.backdrop} onClick={close} aria-hidden="true" />
        <div ref={panelRef} className={s.panel} role="dialog" aria-modal="true" aria-label="Site menu">
          <PlusMarker className={s.panelPlus} />
          <button type="button" className={s.close} onClick={close}>
            <RollText text="CLOSE" className={s.menuLabel} />
          </button>
          <nav aria-label="Primary">
            <ul className={s.links}>
              {menuLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={s.link}
                    aria-current={pathname === link.href ? "page" : undefined}
                    onClick={close}
                  >
                    <RollText text={link.label} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
