"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { Counter } from "@/types/sites/norda-framer-website-3f1ea7cb";
import { useScrollFrame } from "@/hooks/sites/norda-framer-website-3f1ea7cb/useScrollFrame";
import { clamp01, prefersReducedMotion } from "@/lib/sites/norda-framer-website-3f1ea7cb/scroll";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/about.module.css";

/**
 * Two rows of counters under hairlines.
 * MEASURED (1440): a 50vh trigger centred on each row drives progress 0→1 as it enters from the
 * viewport bottom; the number+label block slides from 202px above its resting place (clipped by the
 * row) down to 32px below the line. The figure reads 0 until ~30% progress, then its final value.
 * Tablet/phone: static at the final position (MEASURED).
 */
export function Counters({ rows }: { rows: Counter[][] }) {
  return (
    <div className={s.counters}>
      {rows.map((row, i) => (
        <CounterRow key={i} row={row} />
      ))}
    </div>
  );
}

function CounterRow({ row }: { row: Counter[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const numberRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const shown = useRef(false);

  useScrollFrame(({ vh, vw }) => {
    const el = rowRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const triggerTop = r.top + r.height / 2 - vh * 0.25;
    // MEASURED: tablet/phone counters sit at their final position (no scroll-linked slide).
    const p = prefersReducedMotion() || vw < 1200 ? 1 : clamp01((vh - triggerTop) / (vh * 0.5));
    el.style.setProperty("--nd-counter-p", p.toFixed(4));
    if (!shown.current && p >= 0.3) {
      shown.current = true;
      numberRefs.current.forEach((n, k) => {
        if (n) n.textContent = String(row[k].value);
      });
    }
  });

  return (
    <div ref={rowRef} className={s.counterRow}>
      {row.map((c, k) => (
        <div key={c.label} className={s.counter}>
          <span className={s.counterLine} aria-hidden="true" />
          <p className={s.counterItem}>
            <span className={site.visuallyHidden}>{`${c.value} ${c.label}`}</span>
            <span
              aria-hidden="true"
              className={s.counterValue}
              ref={(n) => {
                numberRefs.current[k] = n;
              }}
            >
              0
            </span>
            <span aria-hidden="true" className={cn(site.label, s.counterLabel)}>
              {c.label}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
