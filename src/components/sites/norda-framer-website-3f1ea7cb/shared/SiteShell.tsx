import type { ReactNode } from "react";
import { InteractionLayer } from "./InteractionLayer";
import { SiteChrome } from "./SiteChrome";
import { SiteFooter } from "./SiteFooter";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";

/**
 * Page frame shared by every route (MEASURED on the reference):
 * fixed chrome → content layer (z 3, black) → footer revealed underneath → cursor follower.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className={site.site}>
      <SiteChrome />
      <div className={site.content}>{children}</div>
      <SiteFooter />
      <InteractionLayer />
    </div>
  );
}
