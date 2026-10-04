import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PlusMarker } from "./icons";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";

/**
 * The source's recurring 1 : 2 : 1 row (side columns collapse on tablet/phone).
 * `plus` draws the 12px "+" marker pinned to the left column's gutter.
 */
export function Columns({
  children,
  plus = false,
  className,
  mainClassName,
  as: Tag = "div",
}: {
  children: ReactNode;
  plus?: boolean;
  className?: string;
  mainClassName?: string;
  as?: "div" | "section" | "article" | "header";
}) {
  return (
    <Tag className={cn(site.columns, className)}>
      <div className={site.side} aria-hidden="true">
        {plus && <PlusMarker className={site.plus} />}
      </div>
      <div className={cn(site.main, mainClassName)}>{children}</div>
      <div className={cn(site.side, site.sideRight)} aria-hidden="true" />
    </Tag>
  );
}
