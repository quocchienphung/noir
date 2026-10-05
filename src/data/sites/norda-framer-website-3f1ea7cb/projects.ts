// Projects listing content, verbatim from the source route /projects (captured 2026-10-04).
import type { ImageRef } from "@/types/sites/norda-framer-website-3f1ea7cb";
import type { RecordRow } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/RecordList";
import type { PageTitleSpec } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/PageHeader";

export const projectsHeader = {
  image: { asset: "yycoWiywVqwYVG8qkhivAidtyGQ", alt: "Nordå" } satisfies ImageRef,
  intro:
    "Our work redefines modern cities, creating spaces that enhance daily life. From residential buildings to office towers, each project reflects our commitment to thoughtful, functional, and lasting design.",
  title: {
    text: "Projects",
    viewBoxWidth: { desktop: 744.0240891387166, tablet: 759.7349335474713, phone: 776.4457779562262 },
    offsetX: -2,
    viewBoxHeight: 252,
    fontSize: 228.9155591245221,
    boxRatio: 4.68,
  } satisfies PageTitleSpec,
};

export const projectsIntro = {
  lead: "Each project is designed to enhance urban life, blending functionality with a timeless aesthetic to create spaces that inspire, connect, and endure.",
  body: "At Nordå, we believe architecture should seamlessly integrate with its surroundings while elevating the way people live and work. Our projects balance aesthetics and practicality, ensuring each structure serves its purpose while standing as a timeless piece of the urban landscape.",
};

/** Listing order on /projects (CMS entries; slugs preserved, including "ström-haus"). */
export const projectCards: { slug: string; name: string; cover: ImageRef }[] = [
  { slug: "verve-tower", name: "Verve Tower", cover: { asset: "zSsaQ6aEIDDticuNpIL0PHy0OKE", alt: "Nordå" } },
  { slug: "harbor-12", name: "Harbor 12", cover: { asset: "EotxlpqJ6kEJA2rkEI4NgwSi4tE", alt: "Nordå" } },
  { slug: "nordic-one", name: "Nordic One", cover: { asset: "quoHgFIveHXEyv49z3HoccYb9E", alt: "Nordå" } },
  { slug: "summit-24", name: "Summit 24", cover: { asset: "QMwodkd9iVZ2uGTwoPHfuLGYBns", alt: "Nordå" } },
  { slug: "ström-haus", name: "Ström Haus", cover: { asset: "pPpkWDlQJHNavXlg5W7E6yoeCU", alt: "Nordå" } },
];

export const archiveProjects: RecordRow[] = [
  { title: "Harbor Point", meta: "Mixed-use waterfront development", year: "2018" },
  { title: "Solheim Tower", meta: "Sleek and efficient high-rise", year: "2017" },
  { title: "Northway Residences", meta: "Modern living in the city", year: "2017" },
  { title: "Fjordhaus", meta: "Scandinavian-inspired apartment complex", year: "2016" },
  { title: "Central Square", meta: "Vibrant commercial and office hub", year: "2015" },
  { title: "Horizon Loft", meta: "Minimalist urban housing concept", year: "2013" },
  { title: "Metro Quarter", meta: "Revitalized district for work & life", year: "2012" },
  { title: "Vinter Park", meta: "Public space with sustainable design", year: "2012" },
];

export const projectsOutro = {
  lead: "At Nordå, we believe architecture shapes the way people experience their cities.",
  body: "From concept to completion, we focus on thoughtful design that responds to its surroundings. By prioritizing sustainability, quality, and innovation, we craft buildings that don’t just stand in the city — they become a meaningful part of it.",
};

export interface ProjectDetail {
  slug: string;
  name: string;
  /** <title> as published on the source CMS page. */
  pageTitle: string;
  location: string;
  year: string;
  hero: ImageRef;
  lead: string;
  body: string[];
  gallery: ImageRef[];
  closing: { lead: string; body: string };
  next: string;
}

const parallax = (asset: string): ImageRef => ({ asset, alt: "Parallax Image" });

/** CMS project entries, verbatim from /projects/<slug> (captured 2026-10-04). */
export const projectDetails: ProjectDetail[] = [
  {
    slug: "verve-tower",
    name: "Verve Tower",
    pageTitle: "Verve Tower - My Framer Site",
    location: "Oslo, Norway",
    year: "2020",
    hero: parallax("zSsaQ6aEIDDticuNpIL0PHy0OKE"),
    lead: "A bold, glass-clad high-rise reshaping the city skyline with energy-efficient design.",
    body: [
      "Rising above Oslo’s urban landscape, Verve Tower is an expression of contemporary urbanism. Its sleek facade enhances natural light while reducing energy consumption. Inside, flexible workspaces and residential units cater to a new generation of city dwellers.",
    ],
    gallery: [parallax("fa1PN9Is8xB8Fy0XdU5dCWDoaA"), parallax("ds1WacnMZhMOeM39tkIZPckxiE"), parallax("GimfgnhDrAlFolDQ4Hv14zCvbU")],
    closing: {
      lead: "Elevating urban living with cutting-edge design and sustainability.",
      body: "More than just a skyscraper, Verve Tower represents Oslo’s vision for a sustainable and livable city. Green rooftops, smart building technologies, and public spaces ensure that the structure gives back to the city as much as it takes.",
    },
    next: "harbor-12",
  },
  {
    slug: "harbor-12",
    name: "Harbor 12",
    pageTitle: "Harbor 12 - My Framer Site",
    location: "Copenhagen, Denmark",
    year: "2021",
    hero: parallax("EotxlpqJ6kEJA2rkEI4NgwSi4tE"),
    lead: "A waterfront residential tower redefining urban living with open views and sustainable design.",
    body: [
      "Harbor 12 blends modern architecture with the charm of Copenhagen’s historic waterfront. Its stepped design maximizes natural light and provides expansive terraces, creating a seamless connection between city life and nature.",
      "Sustainable materials and energy-efficient solutions define its construction.",
    ],
    gallery: [parallax("gAgUqqczECCYzylilu6Ub6ydpFY"), parallax("rObpmbP7nGyCP4OhYUOqgSn5lj0"), parallax("8ZDBAeASTgDqaVaS8nUSIPji9BQ")],
    closing: {
      lead: "A modern landmark on the water, where city meets serenity.",
      body: "Designed with urban life in mind, Harbor 12 offers a balance between privacy and community. Smart layouts, high-quality materials, and green energy solutions ensure a future-proof living experience in one of Copenhagen’s most dynamic districts.",
    },
    next: "nordic-one",
  },
  {
    slug: "nordic-one",
    name: "Nordic One",
    pageTitle: "Nordic One - My Framer Site",
    location: "Helsinki, Finland",
    year: "2019",
    hero: parallax("quoHgFIveHXEyv49z3HoccYb9E"),
    lead: "A mixed-use development combining work, living, and leisure in a single architectural statement.",
    body: [
      "Nordic One is a multi-functional space that redefines city living. With offices, apartments, and cultural venues under one roof, it creates an ecosystem for a modern, connected lifestyle.",
      "Thoughtful design ensures sustainability, efficiency, and comfort for urban dwellers.",
    ],
    gallery: [parallax("pFFkGC8SzGKotopYelcO7roPSM"), parallax("nsgUp04wvHumuHCaIYaWpwzg0")],
    closing: {
      lead: "An urban hub where work, life, and culture converge.",
      body: "Nordic One embraces the evolving nature of cities, offering adaptable spaces that encourage interaction and innovation. It’s not just a building — it’s a new way to experience city life, merging professional and personal spaces seamlessly.",
    },
    next: "summit-24",
  },
  {
    slug: "summit-24",
    name: "Summit 24",
    pageTitle: "Summit 24 - My Framer Site",
    location: "Stockholm, Sweden",
    year: "2022",
    hero: parallax("QMwodkd9iVZ2uGTwoPHfuLGYBns"),
    lead: "A landmark office complex merging innovation, sustainability, and architectural excellence.",
    body: [
      "Summit 24 is more than just an office space — it’s a vertical campus designed for collaboration and efficiency. Its biophilic design integrates greenery throughout, while advanced climate control systems and modular interiors offer a workspace that evolves with its users.",
    ],
    gallery: [parallax("pZolQuu1Ut59Rxts1xfKcpKe1y4"), parallax("ujKTffa9w9hbntsN6t40S1oxBzI"), parallax("1az2whDZFWKmeFJYNurN1NL1I")],
    closing: {
      lead: "A workplace reimagined — smart, green, and future-ready.",
      body: "Offices should be more than places to work; they should inspire. Summit 24 embodies this vision, offering light-filled spaces, adaptive layouts, and sustainable solutions to create a workspace that enhances both productivity and well-being.",
    },
    next: "ström-haus",
  },
  {
    slug: "ström-haus",
    name: "Ström Haus",
    pageTitle: "Ström Haus - My Framer Site",
    location: "Reykjavik, Iceland",
    year: "2018",
    hero: parallax("pPpkWDlQJHNavXlg5W7E6yoeCU"),
    lead: "A dynamic residential complex designed for urban efficiency and social connection.",
    body: [
      "Ström Haus introduces a new standard for apartment living in Stockholm. Compact yet spacious units maximize function without compromising comfort. Communal gardens, rooftop terraces, and smart energy systems encourage a sustainable and connected urban lifestyle.",
    ],
    gallery: [parallax("DK9javDVvaM4Gel5FODoca6oh0"), parallax("wIjCfNZKQJgk15JSyFQ4VDMlE1g")],
    closing: {
      lead: "Rethinking city living with intelligent design and shared spaces.",
      body: "In a city where space is a premium, Ström Haus offers a new approach to modern housing—efficient, flexible, and beautifully integrated into Stockholm’s evolving skyline. It’s a place where people thrive, not just reside.",
    },
    next: "verve-tower",
  },
];

export function getProject(slug: string): ProjectDetail | undefined {
  return projectDetails.find((p) => p.slug === slug);
}
