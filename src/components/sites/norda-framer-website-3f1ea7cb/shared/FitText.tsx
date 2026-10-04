import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/fit-text.module.css";

/**
 * Framer "Fit Text": the text is laid out at a fixed size inside an SVG viewBox and the SVG scales to its
 * box (values copied from the reference markup: viewBox, font size, tracking, line height).
 * Decorative copy — callers provide the accessible text separately.
 */
export function FitText({
  lines,
  viewBox,
  fontSize,
  letterSpacing,
  lineHeight,
  className,
}: {
  lines: string[];
  viewBox: string;
  fontSize: number;
  letterSpacing: string;
  lineHeight: string;
  className?: string;
}) {
  return (
    <svg viewBox={viewBox} className={cn(s.fit, className)} aria-hidden="true" focusable="false">
      <foreignObject width="100%" height="100%" overflow="visible">
        <p className={s.text} style={{ fontSize, letterSpacing, lineHeight } as CSSProperties}>
          {lines.map((l, i) => (
            <span key={i}>
              {l}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </p>
      </foreignObject>
    </svg>
  );
}
