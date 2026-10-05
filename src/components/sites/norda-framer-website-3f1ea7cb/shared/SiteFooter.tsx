"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { sitemapColumns } from "@/data/sites/norda-framer-website-3f1ea7cb/navigation";
import { assets } from "@/data/sites/norda-framer-website-3f1ea7cb/assets";
import { useScrollFrame } from "@/hooks/sites/norda-framer-website-3f1ea7cb/useScrollFrame";
import { clamp01, prefersReducedMotion } from "@/lib/sites/norda-framer-website-3f1ea7cb/scroll";
import { ArrowUpIcon, FacebookIcon, InstagramIcon, XLogoIcon } from "./icons";
import { NewsletterForm } from "./NewsletterForm";
import { RollText } from "./RollText";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/footer.module.css";

const wordmark = assets.FHIcLfBCbUtxnbce6yhoriDk;

/**
 * Footer revealed from beneath the content layer.
 * MEASURED (desktop ≥1200 only): the footer starts 480px up and settles to 0 while it scrolls through
 * its own height; the giant wordmark fades 0 → 0.12 over the same range. Tablet/phone are static.
 */
export function SiteFooter() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  useScrollFrame(({ vw, vh }) => {
    const wrap = wrapRef.current;
    const footer = footerRef.current;
    if (!wrap || !footer) return;
    if (vw < 1200 || prefersReducedMotion()) {
      footer.style.removeProperty("--nd-footer-p");
      return;
    }
    const top = wrap.getBoundingClientRect().top;
    const h = wrap.offsetHeight;
    // 0 when the wrapper's top meets the viewport bottom, 1 after scrolling through its height.
    const p = clamp01((vh - top) / h);
    footer.style.setProperty("--nd-footer-p", p.toFixed(4));
  });

  const scrollTop = () => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });

  return (
    <div ref={wrapRef} className={s.wrap}>
      <footer ref={footerRef} className={s.footer} data-cursor="dot-white">
        <div className={s.wordmark} aria-hidden="true">
          <Image src={wordmark.src} alt="" width={wordmark.width} height={wordmark.height} className={s.wordmarkImg} />
        </div>
        <div className={s.spacer} />

        <div className={s.row}>
          <div className={s.side} />
          <div className={s.main}>
            <NewsletterForm />
          </div>
          <div className={s.side} />
        </div>

        <div className={s.row}>
          <div className={s.side} />
          <div className={s.main}>
            <nav className={s.sitemap} aria-label="Sitemap">
              <p className={cn(site.label, s.sitemapTitle)}>/&nbsp; Sitemap</p>
              <div className={s.sitemapCols}>
                {sitemapColumns.map((col, i) => (
                  <ul key={i} className={s.sitemapCol}>
                    {col.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className={s.sitemapLink} data-cursor="none">
                          <RollText text={link.label} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </nav>
          </div>
          <div className={s.side} />
        </div>

        <div className={s.bottom}>
          <div className={s.utility}>
            {/* External-only platform links on the source; kept as labelled, inert icons. */}
            <ul className={s.social} aria-label="Social media (external links not included in this reconstruction)">
              <li title="Facebook — external link not included" data-cursor="none">
                <FacebookIcon className={s.socialIcon} />
                <span className={site.visuallyHidden}>Facebook</span>
              </li>
              <li title="X (Twitter) — external link not included" data-cursor="none">
                <XLogoIcon className={s.socialIcon} />
                <span className={site.visuallyHidden}>X (Twitter)</span>
              </li>
              <li title="Instagram — external link not included" data-cursor="none">
                <InstagramIcon className={s.socialIcon} />
                <span className={site.visuallyHidden}>Instagram</span>
              </li>
            </ul>
            <button type="button" className={s.backToTop} onClick={scrollTop} data-cursor="none">
              <ArrowUpIcon className={s.backToTopIcon} />
              <RollText text="BACK TO TOP" className={s.backToTopLabel} />
            </button>
          </div>
          <div className={s.legal}>
            <p className={cn(site.label, s.copyright)}>Copyright 2026 Nordå. All&nbsp;rights reserved.</p>
            <p className={cn(site.label, s.attribution)} data-cursor="none">Framer template handcrafted by Anton Drukarov</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
