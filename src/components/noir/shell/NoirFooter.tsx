"use client";

import Link from "next/link";
import { brand, footerNav, home, routes } from "@/data/noir/site";
import { NoirMark } from "../brand";
import s from "@/styles/noir/footer.module.css";

export function NoirFooter() {
  const toTop = () => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <footer className={s.footer}>
      <div className={s.top}>
        <div className={s.pitch}>
          <h2 className={s.title}>{home.cta.title}</h2>
          <Link href={routes.contact} className={s.cta}>
            {home.cta.primary.label}
            <svg viewBox="0 0 16 16" aria-hidden="true" className={s.ctaIcon}>
              <path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
        </div>
        <nav aria-label="Footer" className={s.nav}>
          <ul className={s.navList}>
            {footerNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={s.navLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={s.brandRow} aria-hidden="true">
        <NoirMark size={132} className={s.brandMark} />
        <span className={s.brandName}>{brand.name}</span>
      </div>

      <div className={s.bottom}>
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
