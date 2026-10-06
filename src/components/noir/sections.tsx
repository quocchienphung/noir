import { TransitionLink } from "./motion/TransitionLink";
import type { ReactNode } from "react";
import { home, principles, process, services } from "@/data/noir/site";
import type { MotionRole } from "@/lib/noir/motion";
import { cn } from "@/lib/utils";
import s from "@/styles/noir/sections.module.css";

/** `motion` names the element's role in the sitewide choreography (components/noir/motion); layout is unchanged. */
export function Eyebrow({ children, className, motion }: { children: ReactNode; className?: string; motion?: MotionRole }) {
  return (
    <p className={cn(s.eyebrow, className)} data-m={motion}>
      {children}
    </p>
  );
}

export function ArrowIcon({ direction = "up-right" }: { direction?: "up-right" | "right" }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={cn(s.arrow, direction === "right" ? s.arrowRight : s.arrowUpRight)}>
      <path
        d={direction === "right" ? "M3 8h10M9 4l4 4-4 4" : "M5 11 11 5M6 5h5v5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function ButtonLink({ href, children, variant = "primary", motion }: { href: string; children: ReactNode; variant?: "primary" | "ghost"; motion?: MotionRole }) {
  return (
    <TransitionLink href={href} className={variant === "primary" ? s.btnPrimary : s.btnGhost} data-m={motion}>
      {children}
      <ArrowIcon direction={variant === "primary" ? "up-right" : "right"} />
    </TransitionLink>
  );
}

/** Services as a native disclosure list: keyboard and screen-reader friendly with no script. */
export function NoirServices() {
  return (
    <section className={s.section} aria-labelledby="noir-services-title">
      <div className={s.inner}>
        <div className={s.split}>
          <div data-m-group="">
            <Eyebrow motion="eyebrow">{home.servicesIntro.eyebrow}</Eyebrow>
            <h2 id="noir-services-title" className={s.heading} data-m="block">
              {home.servicesIntro.title}
            </h2>
          </div>
          <div className={s.accordion} data-m-group="">
            {services.map((service, i) => (
              <details key={service.id} className={s.item} name="noir-services" open={i === 0} data-m="item">
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
        <Eyebrow motion="eyebrow">{home.processIntro.eyebrow}</Eyebrow>
        <h2 id="noir-process-title" className={s.heading} data-m="block">
          {home.processIntro.title}
        </h2>
        <ol className={s.steps} data-m-group="">
          {process.map((step, i) => (
            <li key={step.id} className={s.step} data-m="item">
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
        <Eyebrow motion="eyebrow">{home.principlesIntro.eyebrow}</Eyebrow>
        <ul className={s.principles} data-m-group="">
          {principles.map((item) => (
            <li key={item.title} className={s.principle} data-m="item">
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
        {eyebrow ? <Eyebrow motion="eyebrow">{eyebrow}</Eyebrow> : null}
        <h1 className={s.pageTitle} data-m="heading">
          {title}
        </h1>
        {lead ? (
          <p className={s.pageLead} data-m="lead">
            {lead}
          </p>
        ) : null}
      </div>
    </header>
  );
}
