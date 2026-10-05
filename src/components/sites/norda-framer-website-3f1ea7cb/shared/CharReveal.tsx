"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties, type ElementType } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/sites/norda-framer-website-3f1ea7cb/scroll";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/char-reveal.module.css";

type Breakpoint = "phone" | "tablet" | "desktop";

const BP_CLASS: Record<Breakpoint, string> = { phone: s.onPhone, tablet: s.onTablet, desktop: s.onDesktop };

/**
 * MEASURED: the load-triggered title starts 1.50s after a client-side navigation click (page mounted
 * ≈0.1s later) and 1.86s after navigation start on a hard load (hydration ≈0.4s) — ≈1.4s after mount.
 */
const LOAD_DELAY_MS = 1400;

/**
 * Per-character text reveal used by a few headings on the source.
 * - mode "line": plays once when the block's top reaches the viewport bottom; 100ms stagger per
 *   rendered line (recomputed on resize).
 * - mode "char": plays once shortly after load; 50ms stagger per character.
 * `delay` (seconds) is added before the first line/character. Text may contain "\n" for a line break.
 * The full string is exposed to assistive technology once; the split glyphs are aria-hidden.
 */
export function CharReveal({
  as: Tag = "p",
  text,
  className,
  mode = "line",
  delay = 0,
  on = ["desktop"],
}: {
  as?: ElementType;
  text: string;
  className?: string;
  mode?: "line" | "char";
  delay?: number;
  on?: Breakpoint[];
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setShown(true);
      return;
    }

    let ro: ResizeObserver | undefined;
    if (mode === "line") {
      const words = [...el.querySelectorAll<HTMLElement>("[data-nd-w]")];
      const assignLines = () => {
        let line = -1;
        let lastTop = Number.NEGATIVE_INFINITY;
        for (const w of words) {
          const top = w.offsetTop;
          if (top > lastTop + 1) {
            line += 1;
            lastTop = top;
          }
          w.style.setProperty("--nd-reveal-line", String(line));
        }
      };
      assignLines();
      ro = new ResizeObserver(assignLines);
      ro.observe(el);
    }

    if (mode === "char") {
      const t = window.setTimeout(() => setShown(true), LOAD_DELAY_MS);
      return () => window.clearTimeout(t);
    }

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setShown(true);
        io.disconnect();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      ro?.disconnect();
    };
  }, [mode]);

  // Split into lines → words/spaces → characters, numbering characters for the char-mode stagger.
  let charIndex = 0;
  const lines = text.split("\n").map((line) =>
    line
      .split(/( +)/)
      .filter(Boolean)
      .map((part) => (/^ +$/.test(part) ? part : Array.from(part).map((ch) => ({ ch, i: charIndex++ })))),
  );

  return (
    <Tag
      ref={ref}
      className={cn(s.reveal, s.armed, s[mode], on.map((b) => BP_CLASS[b]), shown && s.shown, className)}
      style={{ "--nd-reveal-delay": `${delay}s` } as CSSProperties}
      data-nd-reveal=""
    >
      <span className={site.visuallyHidden}>{text.replace(/\n/g, " ")}</span>
      <span aria-hidden="true">
        {lines.map((line, li) => (
          <Fragment key={li}>
            {li > 0 && <br />}
            {line.map((part, wi) =>
              typeof part === "string" ? (
                part
              ) : (
                <span key={wi} className={s.word} data-nd-w="">
                  {part.map(({ ch, i }) => (
                    <span key={i} className={s.c} data-nd-c="" style={{ "--nd-reveal-i": i } as CSSProperties}>
                      {ch}
                    </span>
                  ))}
                </span>
              ),
            )}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
