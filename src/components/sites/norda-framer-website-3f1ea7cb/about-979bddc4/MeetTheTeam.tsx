"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type CSSProperties } from "react";
import { team } from "@/data/sites/norda-framer-website-3f1ea7cb/team";
import { imageAsset } from "@/lib/sites/norda-framer-website-3f1ea7cb/media";
import { routes } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";
import { prefersReducedMotion } from "@/lib/sites/norda-framer-website-3f1ea7cb/scroll";
import { useScrollFrame } from "@/hooks/sites/norda-framer-website-3f1ea7cb/useScrollFrame";
import { FitText } from "../shared/FitText";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/about-979bddc4/team.module.css";

/**
 * "Meet the Team". MEASURED (desktop): the heading is sticky for 100vh while a 2340px layer of nine
 * portraits scrolls over it; each portrait sits at an authored left% / top px and drifts at its own
 * scroll-speed factor once the section reaches the viewport top. Hover enlarges the card (189→197px)
 * and fades the name up. Tablet: 3-column grid; phone: single column; names always visible.
 */
export function MeetTheTeam() {
  const sectionRef = useRef<HTMLElement>(null);

  useScrollFrame(({ vw }) => {
    const el = sectionRef.current;
    if (!el) return;
    // Drift starts once the section top reaches the viewport top (MEASURED: no offset before).
    const d = vw >= 1200 && !prefersReducedMotion() ? Math.max(0, -el.getBoundingClientRect().top) : 0;
    el.style.setProperty("--nd-team-d", `${d.toFixed(1)}px`);
  });

  return (
    <section ref={sectionRef} id="meet-the-team" className={s.section} aria-labelledby="nd-team-title">
      <div className={s.title}>
        <h2 id="nd-team-title" className={s.heading}>
          <span className={site.visuallyHidden}>Meet the Team</span>
          <FitText
            lines={["MEET", "THE TEAM"]}
            viewBox="0 0 1074.5 388"
            fontSize={215.54759965235962}
            letterSpacing="-0.04em"
            lineHeight="90%"
            className={s.headingSvg}
          />
        </h2>
      </div>
      <ul className={s.layer}>
        {team.map((m, i) => {
          const img = imageAsset(m.portrait.asset);
          return (
            <li
              key={m.slug}
              className={s.member}
              style={
                {
                  "--nd-left": `${m.scatter.left}%`,
                  "--nd-top": `${m.scatter.top}px`,
                  "--nd-rate": m.scatter.rate,
                  "--nd-z": team.length - i,
                } as CSSProperties
              }
            >
              <Link href={routes.team(m.slug)} className={s.card}>
                <Image
                  src={img.src}
                  alt={m.portrait.alt}
                  fill
                  sizes="(min-width: 1200px) 15vw, (min-width: 810px) 30vw, 100vw"
                  className={s.photo}
                  style={{ objectPosition: m.thumbPosition }}
                />
                <span className={s.name}>{m.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
