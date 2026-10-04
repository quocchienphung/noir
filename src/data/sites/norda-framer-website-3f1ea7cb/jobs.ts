// Vacancies, verbatim from /jobs/<slug> (captured 2026-10-04).
import type { ImageRef } from "@/types/sites/norda-framer-website-3f1ea7cb";

export interface JobRecord {
  slug: string;
  title: string;
  /** Short description shown in "Join Our Team" / "More Jobs" lists. */
  summary: string;
  location: string;
  type: string;
  hero: ImageRef;
  intro: string;
  candidatesMust: string[];
  role: string;
  quote: { text: string; author: string; teamSlug: string; portrait: ImageRef };
}

/** Shared "We offer" list (identical on every vacancy). */
export const jobOffer = [
  "A supportive environment that encourages continuous learning and professional growth.",
  "Recognition for dedication, with clear paths for promotion and increased responsibilities.",
  "A competitive salary package aligned with industry standards and experience.",
  "The chance to collaborate with renowned architects on innovative and inspiring projects.",
];

/** "How to apply" copy; {…} marks the bold run. */
export const jobHowToApply = "Submit your PDF portfolio and CV (max 10MB) to {hello@norda.com} to be considered for the role.";

const parallax = (asset: string): ImageRef => ({ asset, alt: "Parallax Image" });

export const jobs: JobRecord[] = [
  {
    slug: "interior-designer",
    title: "Interior Designer",
    summary: "Craft beautiful, functional interiors that merge Nordic aesthetics with clients’ needs, enhancing the essence of every project.",
    location: "London",
    type: "Fulltime (32-40h)",
    hero: parallax("m27LDp37qZqFhJXQD3e2m0RJTc"),
    intro:
      "As an Interior Designer at Nordå, you will be instrumental in shaping the interiors of our projects, creating spaces that reflect the Nordic aesthetic while meeting functional needs.",
    candidatesMust: [
      "Have a degree in interior design or related field and 3+ years of experience.",
      "Be skilled in space planning, material selection, and color theory.",
      "Be proficient in SketchUp, Rhino, and Adobe Creative Suite.",
      "Show strong client communication and presentation skills.",
      "Be familiar with sustainable design practices and sourcing.",
    ],
    role: "You will collaborate with clients and the design team to select materials, finishes, and furnishings that align with project goals. Creativity and attention to detail are key to excelling in this role.",
    quote: {
      text: "\"We’re looking for a designer who understands that interiors tell stories — stories of culture, comfort, and identity.\"",
      author: "– Erik Lindholm, Co-founder",
      teamSlug: "erik-lindholm",
      portrait: parallax("PEcI5dggh8bXzV08LS6PkV2Xk"),
    },
  },
  {
    slug: "landscape-architect",
    title: "Landscape Architect",
    summary: "Design outdoor spaces that harmonize with architecture, blending sustainability, biodiversity, and user experience.",
    location: "Stockholm",
    type: "Full-time (32–40h)",
    hero: parallax("RkgFG9JwTKpW5z8IzOInk1Gz9nE"),
    intro: "As a Landscape Architect at Nordå, you will design outdoor spaces that seamlessly integrate with our architectural projects.",
    candidatesMust: [
      "Have a degree in landscape architecture or related field and 3+ years of experience.",
      "Be proficient in CAD, GIS, and rendering software.",
      "Show a strong understanding of native plant species and ecological design.",
      "Be detail-oriented with excellent project management skills.",
      "Have experience in collaborating with multidisciplinary teams.",
    ],
    role: "Your work will enhance the connection between the built environment and the natural world, focusing on sustainability, biodiversity, and user experience.",
    quote: {
      text: "\"Our landscapes are extensions of our buildings. We need someone who understands the language of both.\"",
      author: "– Linnea Sörensen, Co-founder",
      teamSlug: "linnea-sörensen",
      portrait: parallax("K8cQ2S75cS2p9XqKge9Zwfm7JE"),
    },
  },
  {
    slug: "3d-artist",
    title: "3D Artist",
    summary: "Bring architectural designs to life with stunning visualizations and photorealistic renderings that showcase Nordå’s creative vision.",
    location: "Stockholm",
    type: "Fulltime (32-40h)",
    hero: parallax("WIyQdhmajcrW3X9cwmW41yu0Esw"),
    intro: "As a 3D Artist at Nordå, you will be responsible for crafting detailed and evocative visual representations of our architectural projects.",
    candidatesMust: [
      "Have a portfolio showcasing high-quality architectural visualizations.",
      "Be proficient in 3ds Max, V-Ray, and other visualization tools.",
      "Demonstrate a deep understanding of lighting, materials, and composition.",
      "Show excellent time management and collaboration skills.",
      "Be willing to stay updated on visualization trends and technologies.",
    ],
    role: "Working closely with architects, designers, and clients, you will translate ideas into impactful visuals that help communicate the vision behind our work.",
    quote: {
      text: "\"Great design deserves equally great visuals. We're looking for someone passionate about making ideas tangible and unforgettable.\"",
      author: "– Erik Lindholm, Co-founder",
      teamSlug: "erik-lindholm",
      portrait: parallax("PEcI5dggh8bXzV08LS6PkV2Xk"),
    },
  },
  {
    slug: "project-architect",
    title: "Project Architect",
    summary: "Lead projects from concept to completion, ensuring seamless execution and alignment with Nordå’s design philosophy.",
    location: "Stockholm or remote",
    type: "Full-time (32–40h)",
    hero: parallax("bJklEygzd5bbI09yaoy5GnbRywQ"),
    intro: "As a Project Architect at Nordå, you will oversee the development of architectural projects from concept to completion.",
    candidatesMust: [
      "Hold a degree in architecture and have 5+ years of professional experience.",
      "Be proficient in Revit, AutoCAD, and Adobe Creative Suite.",
      "Demonstrate strong project management and problem-solving skills.",
      "Have a deep understanding of sustainable design principles.",
      "Be fluent in English; knowledge of Swedish is a plus.",
    ],
    role: "This role requires strong leadership skills, technical expertise, and a passion for innovative architectural solutions.",
    quote: {
      text: "\"We’re searching for architects who see challenges as opportunities to create meaningful, impactful spaces.\"",
      author: "– Linnea Sörensen, Co-founder",
      teamSlug: "linnea-sörensen",
      portrait: parallax("K8cQ2S75cS2p9XqKge9Zwfm7JE"),
    },
  },
];

export function getJob(slug: string): JobRecord | undefined {
  return jobs.find((j) => j.slug === slug);
}
