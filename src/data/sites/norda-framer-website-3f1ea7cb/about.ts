// About page content, verbatim from https://norda.framer.website/about (captured 2026-10-04).
import type { ImageRef } from "@/types/sites/norda-framer-website-3f1ea7cb";
import type { RecordRow } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/RecordList";
import type { PageTitleSpec } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/PageHeader";

export const aboutHeader = {
  image: { asset: "XEWZJ3zUKUmzUZ2urWeG54bCdK4", alt: "Nordå" } satisfies ImageRef,
  objectPosition: "83.9% 22.2%",
  intro:
    "Guided by founders Erik Lindholm and Linnea Sörensen, our team merges innovation with timeless design to craft spaces that seamlessly connect people, nature, and architecture.",
  title: {
    text: "About",
    viewBoxWidth: { wide: 756.010720823699, phone: 780.0076577312135 },
    viewBoxHeight: 330,
    fontSize: 300.15315462427105,
    boxRatio: 3.55,
    phoneFullWidth: true,
  } satisfies PageTitleSpec,
};

export const aboutIntro = {
  lead: "Rooted in Scandinavian design traditions, we approach every project with a deep respect for the city, its history, and the people who shape its future.",
  body: "Collaboration is at the heart of everything we do. By working closely with clients, planners, and experts, we design spaces that balance functionality, beauty, and sustainability. Each project contributes to the urban landscape, creating meaningful connections between architecture, its surroundings, and the people who experience it.",
};

export const aboutTeamImage: ImageRef = { asset: "elBa3XaEJn1QDegerJbF576v4BE", alt: "Parallax Image" };
export const aboutBadgeText = "NORDÅ ARCHITECTS DREAM TEAM ~";

export const publications: RecordRow[] = [
  { title: "Harmony in Design", meta: "Nordic Living", year: "2024" },
  { title: "Timeless Aesthetics", meta: "Scandinavian Spaces", year: "2023" },
  { title: "Nature Meets Architecture", meta: "Form & Function", year: "2021" },
  { title: "Crafting the Future", meta: "ArchiView", year: "2020" },
  { title: "Simplicity Redefined", meta: "Design Nordic", year: "2018" },
  { title: "Sustainable Spaces", meta: "Architectural Digest", year: "2016" },
];

export const aboutClosing = {
  lead: "Together, we merge innovation with tradition, delivering spaces that honor their surroundings while meeting modern needs with precision and care.",
  body: "We stand by principles of timeless design, sustainable practices, and a commitment to quality at every stage. With decades of experience and a reputation for excellence, Nordå is a trusted partner for those seeking meaningful, lasting architectural solutions.",
};

export const aboutOfficeImage: ImageRef = { asset: "H0GrbHxwUWuqZBEI4TZIMPtI", alt: "Parallax Image" };
