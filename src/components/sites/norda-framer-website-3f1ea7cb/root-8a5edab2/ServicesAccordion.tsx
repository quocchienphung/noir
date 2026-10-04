"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import type { ServiceStep } from "@/types/sites/norda-framer-website-3f1ea7cb";
import { RichText } from "../shared/RichText";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/services.module.css";

/**
 * Process accordion. MEASURED: click-driven, items open independently (several may be open),
 * height eases open over ~480ms, "+" turns into "−", a black dot cursor shows over rows.
 */
export function ServicesAccordion({ steps }: { steps: ServiceStep[] }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const baseId = useId();

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <ul className={s.accordion}>
      {steps.map((step, i) => {
        const isOpen = open.has(i);
        const headId = `${baseId}-h${i}`;
        const panelId = `${baseId}-p${i}`;
        return (
          <li key={step.number} className={s.item} data-open={isOpen ? "" : undefined} data-cursor="dot">
            <div className={s.number} aria-hidden="true">
              <span className={site.label}>/&nbsp; {step.number}</span>
            </div>
            <div className={s.content}>
              <h3 className={s.heading}>
                <button
                  type="button"
                  id={headId}
                  className={s.trigger}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggle(i)}
                >
                  <span className={cn(site.title, s.title)}>{step.title}</span>
                  <span className={s.icon} aria-hidden="true">
                    <span className={s.barH} />
                    <span className={s.barV} />
                  </span>
                </button>
              </h3>
              <div id={panelId} role="region" aria-labelledby={headId} className={s.panel} inert={!isOpen}>
                <div className={s.panelInner}>
                  <RichText blocks={step.body} className={s.body} />
                </div>
              </div>
            </div>
            <div className={s.sideRight} aria-hidden="true" />
          </li>
        );
      })}
    </ul>
  );
}
