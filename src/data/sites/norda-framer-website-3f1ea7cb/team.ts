// Team members, verbatim from /team/<slug> and the About "Meet the Team" section (captured 2026-10-04).
import type { ImageRef } from "@/types/sites/norda-framer-website-3f1ea7cb";

export interface TeamRecord {
  /** Decoded slug; routes encode it (e.g. linnea-sörensen → linnea-s%C3%B6rensen). */
  slug: string;
  name: string;
  role: string;
  portrait: ImageRef;
  /** object-position used for the About-page thumbnail crop (MEASURED). */
  thumbPosition: string;
  bio: string;
  education: { year: string; text: string }[];
  recognition: { year: string; text: string }[];
  /**
   * Desktop "Meet the Team" placement (MEASURED from authored CSS): horizontal centre in % of the
   * layer, top offset in px, and the scroll-speed factor applied after the section reaches the top.
   */
  scatter: { left: number; top: number; rate: number };
}

const portrait = (asset: string): ImageRef => ({ asset, alt: "Nordå" });

/** Natural order (touch-layout grid order); the desktop DOM paints them in reverse. */
export const team: TeamRecord[] = [
  {
    slug: "erik-lindholm",
    name: "Erik Lindholm",
    role: "Founder & Lead Architect",
    portrait: portrait("PEcI5dggh8bXzV08LS6PkV2Xk"),
    thumbPosition: "50.5% 23%",
    bio: "Erik combines a deep respect for Nordic traditions with a passion for forward-thinking design. His holistic approach ensures every project is functional, timeless, and grounded in its surroundings.",
    education: [
      { year: "2012", text: "KTH Royal Institute of Technology, Master of Architecture" },
      { year: "2010", text: "KTH Royal Institute of Technology, Bachelor of Architecture" },
    ],
    recognition: [
      { year: "2018", text: "Swedish Design Award for Sustainable Architecture" },
      { year: "2015", text: "Nordic Architecture Prize, Best Emerging Designer" },
    ],
    scatter: { left: 26, top: -88, rate: 0 },
  },
  {
    slug: "linnea-sörensen",
    name: "Linnea Sörensen",
    role: "Co-Founder & Interior Design Specialist",
    portrait: portrait("K8cQ2S75cS2p9XqKge9Zwfm7JE"),
    thumbPosition: "49.9% 25.3%",
    bio: "Linnea excels in creating spaces that balance warmth and minimalism. Her focus on human-centric design brings purpose and elegance to every project.",
    education: [
      { year: "2013", text: "Oslo School of Architecture and Design, Master of Interior Architecture" },
      { year: "2011", text: "Oslo School of Architecture and Design, Bachelor of Interior Design" },
    ],
    recognition: [
      { year: "2019", text: "Scandinavian Design Excellence Award" },
      { year: "2016", text: "Nordic Interiors Showcase, People’s Choice Award" },
    ],
    scatter: { left: 82, top: 74, rate: -0.214 },
  },
  {
    slug: "freja-karlsson",
    name: "Freja Karlsson",
    role: "Sustainable Design Consultant",
    portrait: portrait("US7sbM3a9dCywQUU02rF6IcKAro"),
    thumbPosition: "48.8% 28.8%",
    bio: "Freja is passionate about eco-friendly design. She integrates innovative sustainable practices into projects, enhancing environmental harmony without compromising aesthetics.",
    education: [
      { year: "2015", text: "Aarhus School of Architecture, Master of Sustainable Architecture" },
      { year: "2013", text: "Aarhus School of Architecture, Bachelor of Architecture" },
    ],
    recognition: [
      { year: "2021", text: "Nordic Green Building Award" },
      { year: "2018", text: "European Sustainability Design Prize" },
    ],
    scatter: { left: 60, top: 37, rate: 0.171 },
  },
  {
    slug: "mikael-andersson",
    name: "Mikael Andersson",
    role: "Project Manager",
    portrait: portrait("bO7ej91Poeap1EE8j3n69naw8Q"),
    thumbPosition: "50% 24.9%",
    bio: "Mikael's expertise lies in managing complex projects with precision and clarity. He ensures seamless coordination between teams and clients, delivering exceptional results on time.",
    education: [
      { year: "2014", text: "Lund University, Master of Architectural Engineering" },
      { year: "2012", text: "Lund University, Bachelor of Construction Management" },
    ],
    recognition: [
      { year: "2020", text: "Swedish Construction Management Excellence Award" },
      { year: "2017", text: "Best Project Manager, Nordic Design Forum" },
    ],
    scatter: { left: 6, top: 298, rate: 0.086 },
  },
  {
    slug: "astrid-nilsen",
    name: "Astrid Nilsen",
    role: "Junior Architect",
    portrait: portrait("B5VJVNYm3wXcZS0POV27MMMtZQ"),
    thumbPosition: "50% 23%",
    bio: "Astrid brings fresh ideas to the team, combining technical knowledge with creative flair. Her designs prioritize innovation and practicality.",
    education: [
      { year: "2021", text: "Chalmers University of Technology, Master of Architecture" },
      { year: "2019", text: "Chalmers University of Technology, Bachelor of Design and Architecture" },
    ],
    recognition: [
      { year: "2023", text: "Young Talent Award, Scandinavian Design Forum" },
      { year: "2020", text: "Best Graduate Thesis, Chalmers University" },
    ],
    scatter: { left: 34, top: 665, rate: -0.171 },
  },
  {
    slug: "elin-jørgensen",
    name: "Elin Jørgensen",
    role: "Landscape Architect",
    portrait: portrait("epiJ46LqWa2pPavDLMIzAUcVXVA"),
    thumbPosition: "46.6% 24.3%",
    bio: "Elin specializes in blending outdoor environments with architectural designs, creating harmonious landscapes that enhance functionality and beauty.",
    education: [
      { year: "2014", text: "University of Copenhagen, Master of Landscape Architecture" },
      { year: "2012", text: "University of Copenhagen, Bachelor of Environmental Design" },
    ],
    recognition: [
      { year: "2021", text: "Nordic Landscape Design Award" },
      { year: "2017", text: "Best Green Integration, Swedish Garden Expo" },
    ],
    scatter: { left: 95, top: 389, rate: 0 },
  },
  {
    slug: "sofia-bergström",
    name: "Sofia Bergström",
    role: "Materials Expert",
    portrait: portrait("MaQGQa1UDNuZINMaDqMzO1upOew"),
    thumbPosition: "49.5% 22.4%",
    bio: "Sofia focuses on sourcing innovative, sustainable materials that enhance design quality. Her expertise ensures all projects combine durability with environmental responsibility.",
    education: [
      { year: "2016", text: "Aalto University, Master of Material Science in Architecture" },
      { year: "2014", text: "Aalto University, Bachelor of Architecture and Design" },
    ],
    recognition: [
      { year: "2022", text: "Scandinavian Materials Innovation Award" },
      { year: "2019", text: "Eco Materials Champion, Nordic Green Forum" },
    ],
    scatter: { left: 25, top: 695, rate: 0.171 },
  },
  {
    slug: "oskar-bjørnsen",
    name: "Oskar Bjørnsen",
    role: "Structural Engineer",
    portrait: portrait("aLV3hdITkYUBP5p7syNayBVdWUg"),
    thumbPosition: "50.1% 23%",
    bio: "Oskar’s precision and technical skills ensure every structure is resilient and functional. He brings innovation to structural solutions, enhancing the integrity of each project.",
    education: [
      { year: "2016", text: "NTNU, Master of Civil Engineering" },
      { year: "2014", text: "NTNU, Bachelor of Structural Engineering" },
    ],
    recognition: [
      { year: "2020", text: "Scandinavian Engineering Innovation Award" },
      { year: "2018", text: "Best Structural Solution, Nordic Build Expo" },
    ],
    scatter: { left: 76, top: 709, rate: 0.129 },
  },
  {
    slug: "jonas-eklund",
    name: "Jonas Eklund",
    role: "Visualization Specialist",
    portrait: portrait("gFlXc6neFBCXkBIHauaxJkROEso"),
    thumbPosition: "47.3% 26%",
    bio: "Jonas transforms ideas into stunning visual narratives. His work bridges the gap between concept and reality, helping clients envision projects in breathtaking detail.",
    education: [
      { year: "2015", text: "Malmö University, Master of Digital Visualization" },
      { year: "2013", text: "Malmö University, Bachelor of Visual Arts and Design" },
    ],
    recognition: [
      { year: "2019", text: "Nordic CGI Excellence Award" },
      { year: "2017", text: "Best Visual Storytelling, Swedish Design Gala" },
    ],
    scatter: { left: 50, top: 903, rate: -0.0425 },
  },
];

export function getTeamMember(slug: string): TeamRecord | undefined {
  return team.find((m) => m.slug === slug);
}
