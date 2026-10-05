import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Columns } from "../Columns";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/inner-main.module.css";

/** Content panel that scrolls over a page header (MEASURED: id "main-container", padding 96/144/192). */
export function InnerMain({ children, tone = "light", className }: { children: ReactNode; tone?: "light" | "dark"; className?: string }) {
  return (
    <main id="main-container" className={cn(s.main, tone === "dark" && s.dark, className)} data-cursor={tone === "dark" ? "dot-white" : undefined}>
      {children}
    </main>
  );
}

/**
 * Lead (36/46.8 · 32/41.6 · 28/36.4) + body copy in the main column (MEASURED: gap 64 / 48 / 32,
 * both capped at 640px).
 */
export function LeadText({ lead, body, plus = true, className }: { lead: string; body?: string; plus?: boolean; className?: string }) {
  return (
    <Columns plus={plus} className={className} mainClassName={s.leadMain}>
      <p className={cn(site.title, s.lead)}>{lead}</p>
      {body && <p className={cn(site.body, s.body)}>{body}</p>}
    </Columns>
  );
}
