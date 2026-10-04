import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/roll.module.css";

/**
 * Character "roll" label used by the source's text links (MENU, CLOSE, About, sitemap…).
 * One readable copy for assistive tech; the split glyphs and their duplicate row are decorative.
 * The roll itself is started by the delegated controller in InteractionLayer (pointer-enter only,
 * no reverse on leave — MEASURED).
 */
export function RollText({ text, className }: { text: string; className?: string }) {
  const chars = Array.from(text);
  return (
    <span className={cn(s.roll, className)} data-roll="">
      <span className={site.visuallyHidden}>{text}</span>
      <span className={s.line} aria-hidden="true">
        {chars.map((c, i) => (
          <span key={i} className={s.char} style={{ "--i": i } as CSSProperties}>
            <span className={s.glyph}>{c === " " ? " " : c}</span>
            <span className={s.dup}>{c === " " ? " " : c}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
