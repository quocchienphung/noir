import type { ReactNode } from "react";
import { NoirFooter } from "./NoirFooter";
import { NoirHeader } from "./NoirHeader";
import s from "@/styles/noir/shell.module.css";

/** Page frame for every route: skip link → fixed header → page content → footer. */
export function NoirShell({ children }: { children: ReactNode }) {
  return (
    <div className={s.shell}>
      <a href="#content" className={s.skip}>
        Skip to content
      </a>
      <NoirHeader />
      <div id="content" className={s.content} tabIndex={-1}>
        {children}
      </div>
      <NoirFooter />
    </div>
  );
}
