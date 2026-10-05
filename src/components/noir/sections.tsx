import Link from "next/link";
import type { ReactNode } from "react";
import { home, principles, process, services } from "@/data/noir/site";
import { cn } from "@/lib/utils";
import s from "@/styles/noir/sections.module.css";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn(s.eyebrow, className)}>{children}</p>;
}

export function ArrowIcon({ direction = "up-right" }: { direction?: "up-right" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={s.arrow}>
      <path
        d={direction === "right" ? "M3 8h10M9 4l4 4-4 4" : "M5 11 11 5M6 5h5v5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "ghost" }) {
  return (
    <Link href={href} className={variant === "primary" ? s.btnPrimary : s.btnGhost}>
      {children}
      <ArrowIcon direction={variant === "primary" ? "up-right" : "right"} />
    </Link>
  );
}

/** Opening statement after the intro: what NOIR does, as plain capability pillars (no counters). */
export function NoirCapabilities() {
  const c = home.capabilities;
  return (
    <section className={s.section} aria-labelledby="noir-capabilities-title">
      <div className={s.inner}>
        <Eyebrow>{c.eyebrow}</Eyebrow>
        <h2 id="noir-capabilities-title" className={cn(s.display, s.reveal)}>
          {c.title}
        </h2>
        <div className={s.capGrid}>
          <p className={cn(s.lead, s.reveal)}>{c.body}</p>
          <ul className={s.pillars} aria-label="Capabilities">
            {c.pillars.map((pillar, i) => (
              <li key={pillar} className={cn(s.pillar, s.reveal)}>
                <span className={s.pillarIndex}>{String(i + 1).padStart(2, "0")}</span>
                {pillar}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** Services as a native disclosure list: keyboard and screen-reader friendly with no script. */
export function NoirServices() {
  return (
    <section className={s.section} aria-labelledby="noir-services-title">
      <div className={s.inner}>
        <div className={s.split}>
          <div>
            <Eyebrow>{home.servicesIntro.eyebrow}</Eyebrow>
            <h2 id="noir-services-title" className={cn(s.heading, s.reveal)}>
              {home.servicesIntro.title}
            </h2>
          </div>
          <div className={s.accordion}>
            {services.map((service, i) => (
              <details key={service.id} className={s.item} name="noir-services" open={i === 0}>
                <summary className={s.summary}>
                  <span className={s.itemIndex}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={s.itemTitle}>{service.title}</span>
                  <span className={s.toggle} aria-hidden="true" />
                </summary>
                <div className={s.itemBody}>
                  <p>{service.summary}</p>
                  <ul className={s.tags}>
                    {service.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function NoirProcess() {
  return (
    <section className={s.section} aria-labelledby="noir-process-title">
      <div className={s.inner}>
        <Eyebrow>{home.processIntro.eyebrow}</Eyebrow>
        <h2 id="noir-process-title" className={cn(s.heading, s.reveal)}>
          {home.processIntro.title}
        </h2>
        <ol className={s.steps}>
          {process.map((step, i) => (
            <li key={step.id} className={cn(s.step, s.reveal)}>
              <span className={s.stepIndex}>{String(i + 1).padStart(2, "0")}</span>
              <h3 className={s.stepTitle}>{step.title}</h3>
              <p className={s.stepBody}>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function NoirPrinciples() {
  return (
    <section className={cn(s.section, s.sectionTight)} aria-label={home.principlesIntro.eyebrow}>
      <div className={s.inner}>
        <Eyebrow>{home.principlesIntro.eyebrow}</Eyebrow>
        <ul className={s.principles}>
          {principles.map((item) => (
            <li key={item.title} className={cn(s.principle, s.reveal)}>
              <h3 className={s.principleTitle}>{item.title}</h3>
              <p className={s.principleBody}>{item.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Page heading block shared by the inner routes. */
export function PageHeader({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: string }) {
  return (
    <header className={s.pageHeader}>
      <div className={s.inner}>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h1 className={s.pageTitle}>{title}</h1>
        {lead ? <p className={s.pageLead}>{lead}</p> : null}
      </div>
    </header>
  );
}
