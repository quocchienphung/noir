import type { NavLink } from "@/types/sites/norda-framer-website-3f1ea7cb";
import { routes } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";

/** Overlay menu (MEASURED order from the open menu DOM). */
export const menuLinks: NavLink[] = [
  { label: "Home", href: routes.home },
  { label: "Projects", href: routes.projects },
  { label: "About", href: routes.about },
  { label: "News", href: routes.news },
  { label: "Contact", href: routes.contact },
];

/** Footer sitemap, two columns of six and five (MEASURED). */
export const sitemapColumns: NavLink[][] = [
  [
    { label: "Home Page", href: routes.home },
    { label: "Projects", href: routes.projects },
    { label: "Project Page", href: routes.project("verve-tower") },
    { label: "About", href: routes.about },
    { label: "Team Member", href: routes.team("erik-lindholm") },
    { label: "Vacancy", href: routes.job("interior-designer") },
  ],
  [
    { label: "News", href: routes.news },
    { label: "Article", href: routes.article("how-architecture-shapes-productivity") },
    { label: "Contact", href: routes.contact },
    { label: "Privacy Policy", href: routes.privacy },
    { label: "404", href: routes.notFound },
  ],
];

/**
 * Social links on the source point at generic platform homepages (facebook.com, x.com, instagram.com).
 * They are external-only, so the reconstruction renders them as inert, labelled icons.
 */
export const socialLabels = ["Facebook", "X (Twitter)", "Instagram"] as const;
