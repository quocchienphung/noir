import { brand } from "@/data/noir/site";
import { cn } from "@/lib/utils";
import s from "@/styles/noir/brand.module.css";

const SIZES = [64, 128, 256, 512] as const;

/**
 * The NOIR burst, rasterised from the supplied mark (scripts/build-noir-brand.mjs). Alpha is the source
 * luminance, so the grain and glow sit naturally on any dark (light variant) or light (dark variant) ground.
 * Rendered with a srcset so small placements never download the large file.
 */
export function NoirMark({
  size,
  variant = "light",
  label,
  className,
  priority = false,
}: {
  /** CSS pixel size of the square mark. */
  size: number;
  variant?: "light" | "dark";
  /** Accessible name; omit when the mark is decorative or labelled by adjacent text. */
  label?: string;
  className?: string;
  priority?: boolean;
}) {
  const base = variant === "light" ? brand.mark.light : brand.mark.dark;
  const srcSet = SIZES.map((w) => `${base}-${w}.png ${w}w`).join(", ");
  const fallback = SIZES.find((w) => w >= size * 2) ?? 512;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static transparent PNG set with a hand-written srcset
    <img
      src={`${base}-${fallback}.png`}
      srcSet={srcSet}
      sizes={`${size}px`}
      width={size}
      height={size}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      className={cn(s.mark, className)}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      draggable={false}
    />
  );
}

/** Mark + live-text wordmark (the name stays real, selectable text). */
export function NoirWordmark({ className, markSize = 30 }: { className?: string; markSize?: number }) {
  return (
    <span className={cn(s.wordmark, className)}>
      <NoirMark size={markSize} priority className={s.wordmarkMark} />
      <span className={s.wordmarkText}>{brand.name}</span>
    </span>
  );
}
