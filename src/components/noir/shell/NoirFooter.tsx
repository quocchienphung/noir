"use client";

import { TransitionLink } from "../motion/TransitionLink";
import { brand, footerNav, home, routes } from "@/data/noir/site";
import { NoirMark } from "../brand";
import s from "@/styles/noir/footer.module.css";

export function NoirFooter() {
  const toTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    // a page surface: fades with the page content on route transitions; its groups reveal once per route visit
    <footer className={s.footer} data-route-surface="footer">
      <div className={s.top} data-m-group="">
        <div className={s.pitch} data-m="block">
          <h2 className={s.title}>{home.cta.title}</h2>
          <TransitionLink href={routes.contact} className={s.cta}>
            {home.cta.primary.label}
            <svg viewBox="0 0 16 16" aria-hidden="true" className={s.ctaIcon}>
              <path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </TransitionLink>
        </div>
        <nav aria-label="Footer" className={s.nav} data-m="block">
          <ul className={s.navList}>
            {footerNav.map((item) => (
              <li key={item.href}>
                <TransitionLink href={item.href} className={s.navLink}>
                  {item.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={s.brandRow} aria-hidden="true" data-m="block">
        <NoirMark size={132} className={s.brandMark} />
        <span className={s.brandName}>{brand.name}</span>
      </div>

      <div className={s.bottom} data-m="block">
        <p className={s.legal}>
          © {brand.year} {brand.name}. {brand.tagline}
        </p>
        <button type="button" className={s.toTop} onClick={toTop}>
          Back to top
          <svg viewBox="0 0 16 16" aria-hidden="true" className={s.ctaIcon}>
            <path d="M8 13V3M4 7l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
    </footer>
  );
}
