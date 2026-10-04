// Homepage content, verbatim from https://norda.framer.website/ (captured 2026-10-04).
import type { Award, Counter, ImageRef, ServiceStep, Testimonial } from "@/types/sites/norda-framer-website-3f1ea7cb";

export const heroSlides: { slug: string; name: string; image: ImageRef }[] = [
  { slug: "verve-tower", name: "Verve Tower", image: { asset: "zSsaQ6aEIDDticuNpIL0PHy0OKE", alt: "Nordå" } },
  { slug: "harbor-12", name: "Harbor 12", image: { asset: "EotxlpqJ6kEJA2rkEI4NgwSi4tE", alt: "Nordå" } },
  { slug: "nordic-one", name: "Nordic One", image: { asset: "quoHgFIveHXEyv49z3HoccYb9E", alt: "Nordå" } },
];

export const intro = {
  heading: ["Nordå — ", "an architecture and design studio based in Stockholm."],
  body: "Founded in Stockholm, Nordå is driven by a deep respect for Nordic design traditions and the rhythm of urban life. The studio focuses on crafting modern spaces that enhance city landscapes, combining simplicity, functionality, and a timeless aesthetic.",
};

export const counters: Counter[][] = [
  [
    { value: 15, label: "Years" },
    { value: 44, label: "Projects" },
  ],
  [
    { value: 8, label: "Awards" },
    { value: 32, label: "Clients" },
  ],
];

export const studioImage: ImageRef = { asset: "LE3rjd9zpvakgOKhWeExVQ2s", alt: "Parallax Image" };

export const leadership = {
  founders: ["Erik Lindholm", "Linnea Sörensen"],
  paragraphs: [
    "Guided by {Erik Lindholm} and {Linnea Sörensen}, the team collaborates closely with clients, developers, and city planners to create spaces that shape the future of urban living.",
    "From concept to completion, Nordå’s work balances innovation and sustainability, enhancing cityscapes with thoughtful, functional, and lasting architecture.",
  ],
};

export const videoStatement = ["Crafting spaces", "where natural beauty", "meets timeless, functional", "design for inspired living."];

export const awards: Award[] = [
  { title: "Best Residential Design", organisation: "European Design Awards", year: "2024", preview: { asset: "meNrcFhnSDlQiFc8Ft9PUdlwmRM", alt: "" } },
  { title: "Sustainable Architecture Prize", organisation: "Green Building Council Awards", year: "2024", preview: { asset: "8ZVwMrMAvQKrz1sGjChciwyO8g", alt: "" } },
  { title: "Excellence in Timber Construction", organisation: "International Woodworks Conference", year: "2023", preview: { asset: "i9IkeVe3nTtWGduRlvEm0pCeHk", alt: "" } },
  { title: "Innovative Use of Materials", organisation: "ArchDaily Global Awards", year: "2022", preview: { asset: "QINY3akxDmnbMqmeOJusZy24ksw", alt: "" } },
  { title: "Outstanding Concept Design", organisation: "World Architecture Biennale", year: "2022", preview: { asset: "hHSXUDSgKFb8JHVZK46IxY4qOQ", alt: "" } },
  { title: "Best Small-Scale Project", organisation: "Architecture Digest Awards", year: "2022", preview: { asset: "RU7tapUCQWOZhaPZpSK5fHV7QU", alt: "" } },
  { title: "Green Building Award", organisation: "Global EcoDesign Forum", year: "2020", preview: { asset: "csnszvg1pOTB5qMDCqIGxJ363g", alt: "" } },
  { title: "Top Project of the Year", organisation: "Design Excellence Awards", year: "2019", preview: { asset: "U556Zr9ySyBIwrKhO304cic8OI", alt: "" } },
];

export const services = {
  title: "Services",
  intro: "At Nordå, we create spaces that blend seamlessly with their surroundings, enhancing both functionality and aesthetic appeal. Our process is thoughtful, collaborative, and tailored to bring your vision to life.",
  image: { asset: "Fkf3LTjj7HXFGfR19eRpz1SvXM", alt: "Parallax Image" } satisfies ImageRef,
};

export const serviceSteps: ServiceStep[] = [
  {
    number: "01",
    title: "Discovery & Visioning",
    body: [
      { type: "p", text: "We begin by immersing ourselves in your goals, preferences, and the unique characteristics of your site. Through conversations and workshops, we build a foundation for the project." },
      { type: "ul", items: ["Collaborative workshops to understand your needs", "Detailed site analysis and feasibility studies", "Development of vision boards and initial sketches"] },
    ],
  },
  {
    number: "02",
    title: "Design Development",
    body: [
      { type: "p", text: "During this stage, your vision begins to take shape as we refine concepts and explore possibilities. We focus on combining creativity with practicality to craft a cohesive design." },
      { type: "ul", items: ["Detailed architectural drawings and 3D renderings", "Selection of materials and finishes"] },
    ],
  },
  {
    number: "03",
    title: "Planning & Coordination",
    body: [
      { type: "p", text: "We ensure a smooth transition from design to construction by managing all planning and coordination details. This step lays the groundwork for an efficient build process." },
      { type: "ul", items: ["Preparation of technical documentation and permits", "Collaboration with engineers and consultants", "Project scheduling and budget alignment"] },
    ],
  },
  {
    number: "04",
    title: "Build & Execute",
    body: [
      { type: "p", text: "Our team oversees the construction process, ensuring that every detail is executed with precision and aligns with the design intent." },
      { type: "ul", items: ["Coordination with contractors and suppliers", "Regular site visits and quality control"] },
    ],
  },
  {
    number: "05",
    title: "Final Touches & Handover",
    body: [
      { type: "p", text: "We bring the project to completion with meticulous attention to detail, ensuring your new space exceeds expectations." },
      { type: "ul", items: ["Final inspections and adjustments", "Styling and furnishing recommendations", "Comprehensive handover for a seamless transition"] },
    ],
  },
];

export const partners = {
  title: ["Our", "Partners"],
  intro: "Collaboration is at the heart of everything we do. By partnering closely with clients, artisans, and specialists, we craft thoughtful designs that seamlessly blend functionality, beauty, and sustainability. Each project tells a unique story, reflecting the harmony between architecture, its environment, and its purpose.",
  /** Two rows of four logo tiles; row B repeats logos 01 and 02 (MEASURED). */
  rows: [
    ["AeAYDNgSY0yy8HPMgkW5i8np38k", "1KDn9KvHtrhEOvNTFqCxDy9eqI", "k8K8ipaWgt7WvGuCtsw9JHkXug", "Lpk3IGwndBCNFqAI24JFdGvSk"],
    ["j5w72I6Rr4X59FioSIPbH9TS6I", "LJeazEwHtS34YQs6Coh9HWuaE", "AeAYDNgSY0yy8HPMgkW5i8np38k", "1KDn9KvHtrhEOvNTFqCxDy9eqI"],
  ],
  outro: "We stand by principles of timeless design, sustainable practices, and a commitment to quality at every stage. With decades of experience and a reputation for excellence, NORDÅ is a trusted partner for those seeking meaningful, lasting architectural solutions.",
};

export const featuredArticle = {
  slug: "how-architecture-shapes-productivity",
  title: "Exploring the Future of Urban Living",
  excerpt: "Cities are evolving faster than ever, and architecture plays a key role in shaping the way we live, work, and connect. From smart infrastructure to adaptive housing, we explore the trends and innovations defining the future of urban environments.",
  image: { asset: "hgwnK5ZFrAduSja5GHXZwI38Gg", alt: "Parallax Image" } satisfies ImageRef,
};

export const testimonials: Testimonial[] = [
  {
    quote: "“The entire process with Nordå was smooth and inspiring. Their team took the time to understand our lifestyle and delivered a home that feels unique.\"",
    author: "— Anna Lindström, Property Owner",
    portrait: { asset: "O8OUO2E58WZgY1Jn9HEjri4V2G4", alt: "" },
  },
  {
    quote: "“Nordå transformed our vision into reality. The design is both timeless and practical, perfectly fitting our family’s needs while respecting the environment.”",
    author: "— Johan Eriksson, Homeowner",
    portrait: { asset: "5wwhsRM2FMYljXoLda5xGvVyk", alt: "" },
  },
  {
    quote: "“We couldn’t be happier with the outcome. Nordå created a beautiful home that feels like a true retreat, blending seamlessly with the natural surroundings.”",
    author: "— Ingrid Dahl, Family Home Owner",
    portrait: { asset: "TVwqQqsrEv3JD9tCWSZxi5bw0", alt: "" },
  },
  {
    quote: "“Nordå brought fresh ideas to the table while staying true to our initial goals. The result is a home that feels both innovative and deeply personal.”",
    author: "— Lars Nyberg, Vacation Property Owner",
    portrait: { asset: "FjHAEx0OKICPXVQdU2AohS9CZXA", alt: "" },
  },
];

export const tickerText = "Nordå Architects ~";
