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
    <div className={site.site} data-cursor="dot">
      {/* Without JavaScript the character reveals never run, so show their text immediately. */}
      <noscript>
        <style>{"[data-nd-reveal] [data-nd-c]{opacity:1!important;transform:none!important}"}</style>
      </noscript>
      <SiteChrome />
      <div className={site.content}>{children}</div>
      <SiteFooter />
      <InteractionLayer />
    </div>
  );
}
