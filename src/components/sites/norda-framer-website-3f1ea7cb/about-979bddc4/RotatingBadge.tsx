import s from "@/styles/sites/norda-framer-website-3f1ea7cb/about-979bddc4/about.module.css";

/**
 * Circular "NORDÅ ARCHITECTS DREAM TEAM ~" badge. MEASURED: SVG textPath on a 100-unit circle,
 * 12.9px / weight 600 / tracking 0.2em, rotating counter-clockwise ≈45°/s (8s per turn, time-driven).
 */
export function RotatingBadge({ text, id }: { text: string; id: string }) {
  return (
    <div className={s.badge} aria-hidden="true">
      <svg viewBox="0 0 100 100" overflow="visible" className={s.badgeSvg}>
        <path id={id} d="M 0 50 L 0 50 A 1 1 0 0 1 100 50 L 100 50 L 100 50 A 1 1 0 0 1 0 50 L 0 50" fill="transparent" />
        <text className={s.badgeText}>
          <textPath href={`#${id}`} startOffset="0" dominantBaseline="hanging">
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
