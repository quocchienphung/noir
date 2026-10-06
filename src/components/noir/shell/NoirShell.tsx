import type { ReactNode } from "react";
import { MotionProvider } from "../motion/MotionProvider";
import { NoirFooter } from "./NoirFooter";
import { NoirHeader } from "./NoirHeader";
import s from "@/styles/noir/shell.module.css";

/** Page frame for every route: skip link → fixed header → page content → footer, under the motion coordinator. */
export function NoirShell({ children }: { children: ReactNode }) {
  return (
    <div className={s.shell}>
      <MotionProvider>
        <a href="#content" className={s.skip}>
          Skip to content
        </a>
        <NoirHeader />
        {/* page surfaces: fade together on route transitions; the fixed header stays */}
        <div id="content" className={s.content} tabIndex={-1} data-route-surface="content">
          {children}
        </div>
        <NoirFooter />
      </MotionProvider>
    </div>
  );
}
