import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowDownRightIcon, ArrowRightIcon } from "./icons";
import { RollText } from "./RollText";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/arrow-link.module.css";

/**
 * Underlined label + arrow link ("About →", "Read Article →").
 * MEASURED: 1px bottom border in the text colour; arrow gap 16 / 12 / 10px.
 * size "lg": 64/76.8 · 50/60 · 40/48 (arrow 52 · 40 · 32); size "md": 36/43.2 · 32/38.4 · 28/33.6 (arrow 32).
 */
export function ArrowLink({
  href,
  label,
  size = "md",
  tone = "dark",
  className,
  cursor,
  icon = "right",
}: {
  href: string;
  label: string;
  size?: "lg" | "md";
  tone?: "dark" | "light";
  className?: string;
  cursor?: string;
  icon?: "right" | "down-right";
}) {
  const Icon = icon === "down-right" ? ArrowDownRightIcon : ArrowRightIcon;
  return (
    <Link href={href} className={cn(s.link, s[size], s[tone], className)} data-cursor={cursor}>
      <RollText text={label} />
      <Icon className={s.arrow} />
    </Link>
  );
}
