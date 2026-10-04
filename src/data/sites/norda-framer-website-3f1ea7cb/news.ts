// News listing + articles, verbatim from /news and /news/<slug> (captured 2026-10-04).
// Note: article titles do not mirror their slugs on the source; both are preserved exactly.
import type { ImageRef } from "@/types/sites/norda-framer-website-3f1ea7cb";
import type { PageTitleSpec } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/PageHeader";

export const newsHeader = {
  image: { asset: "feajQRYwFuJDhlJV93C6tvynk0", alt: "Nordå" } satisfies ImageRef,
  objectPosition: "50% 0%",
  intro:
    "Discover the latest projects, industry insights, and studio updates from Nordå. Stay informed about our work, design philosophy, and the ideas shaping modern urban architecture.",
  title: {
    text: "News",
    viewBoxWidth: { wide: 575.6242069005958, phone: 591.5887192147113 },
    viewBoxHeight: 277,
    fontSize: 251.7743842942262,
    boxRatio: 3.22,
  } satisfies PageTitleSpec,
};

export interface ArticleSection {
  heading: string;
  body: string;
}

export interface ArticleRecord {
  slug: string;
  title: string;
  /** <title> as published on the source. */
  pageTitle: string;
  date: string;
  readingTime: string;
  excerpt: string;
  cover: ImageRef;
  sections: [ArticleSection, ArticleSection];
}

// The two body paragraphs are the same template copy on every source article.
const BODY_1 =
  "Design influences behavior. Open layouts encourage collaboration, while quiet zones enhance focus. Balancing these elements creates workplaces that support different work styles and needs. Architecture is more than just structures — it’s about shaping experiences, enhancing communities, and creating spaces that inspire. Every design choice, from materials to layout, influences how people interact with their surroundings. Thoughtful architecture considers both form and function, ensuring that beauty and practicality coexist in perfect balance.";
const BODY_2 =
  "Future-proof office spaces are designed for change. Flexible work areas, reconfigurable furniture, and technology integration allow offices to evolve alongside the workforce. As cities evolve, so do the demands of modern living. Sustainable materials, energy efficiency, and adaptable spaces are no longer optional but essential elements of contemporary design. By embracing innovation while respecting tradition, architects can craft environments that not only serve today’s needs but also stand the test of time.";

const cover = (asset: string): ImageRef => ({ asset, alt: "Parallax Image" });

/** Listing order on /news. */
export const articles: ArticleRecord[] = [
  {
    slug: "how-architecture-shapes-productivity",
    title: "Exploring the Future of Urban Living",
    pageTitle: "Exploring the Future of Urban Living - Nordå Architects",
    date: "June 20, 2025",
    readingTime: "3 Minutes",
    excerpt:
      "Cities are evolving faster than ever, and architecture plays a key role in shaping the way we live, work, and connect. From smart infrastructure to adaptive housing, we explore the trends and innovations defining the future of urban environments.",
    cover: cover("hgwnK5ZFrAduSja5GHXZwI38Gg"),
    sections: [
      { heading: "The Psychology of Space", body: BODY_1 },
      { heading: "The Importance of Adaptability", body: BODY_2 },
    ],
  },
  {
    slug: "net-zero-buildings-the-next-step-in-architecture",
    title: "The Balance of Form and Function",
    pageTitle: "The Balance of Form and Function - Nordå Architects",
    date: "May 5, 2025",
    readingTime: "3 Minutes",
    excerpt:
      "Striking the perfect balance between aesthetics and usability is at the core of great design. Whether it’s residential spaces, commercial buildings, or public architecture, every element must serve a purpose while maintaining a sense of beauty and harmony.",
    cover: cover("zsseGMumNCUoSX1dcqWG7uUVkpM"),
    sections: [
      { heading: "The Push Toward Carbon Neutrality", body: BODY_1 },
      { heading: "The Long-Term Benefits of Sustainable Design", body: BODY_2 },
    ],
  },
  {
    slug: "the-role-of-public-spaces-in-cities",
    title: "Reinventing Office Spaces for Tomorrow",
    pageTitle: "Reinventing Office Spaces for Tomorrow - Nordå Architects",
    date: "April 8, 2025",
    readingTime: "5 Minutes",
    excerpt:
      "The way we work is changing, and office spaces need to keep up. Flexibility, collaboration, and well-being are now central to workplace design. Discover how architects and designers are creating environments that inspire productivity and creativity.",
    cover: cover("y7BinKhCRdRKpMDQnG6YUhgbues"),
    sections: [
      { heading: "Designing for Community Engagement", body: BODY_1 },
      { heading: "Balancing Aesthetics and Functionality", body: BODY_2 },
    ],
  },
  {
    slug: "building-with-purpose",
    title: "The Role of Light in Architectural Design",
    pageTitle: "The Role of Light in Architectural Design - Nordå Architects",
    date: "February 4, 2025",
    readingTime: "6 Minutes",
    excerpt:
      "Light is one of the most powerful tools in architecture, shaping mood, perception, and functionality. Whether natural or artificial, the way light interacts with a space can transform its atmosphere and purpose. Here’s how architects use light to enhance their designs.",
    cover: cover("y9YtSbd3rlGAqDPWwWdf1HjWM"),
    sections: [
      { heading: "The Rise of Responsible Construction", body: BODY_1 },
      { heading: "Innovative Materials Shaping the Future", body: BODY_2 },
    ],
  },
  {
    slug: "the-future-of-office-spaces",
    title: "Building with a Sustainable Mindset",
    pageTitle: "Building with a Sustainable Mindset - Nordå Architects",
    date: "March 10, 2025",
    readingTime: "4 Minutes",
    excerpt:
      "Sustainability is no longer an option—it’s a necessity. From energy-efficient materials to circular design principles, architecture must minimize its environmental impact while enhancing quality of life. Let’s take a look at the strategies shaping a more sustainable future.",
    cover: cover("IyRXmFf7Oogbpz3cI2Cx1swwiw0"),
    sections: [
      { heading: "Adapting to a Hybrid Workforce", body: BODY_1 },
      { heading: "Prioritizing Well-being and Functionality", body: BODY_2 },
    ],
  },
  {
    slug: "designing-cities-for-tomorrow",
    title: "Designing for Density: Smart Urban Solutions",
    pageTitle: "Designing for Density: Smart Urban Solutions - Nordå Architects",
    date: "January 12, 2025",
    readingTime: "5 Minutes",
    excerpt:
      "As urban populations grow, space becomes a valuable resource. Thoughtful design can make high-density living more comfortable, efficient, and community-driven. Explore how smart architecture is redefining modern cities while maintaining livability and sustainability.",
    cover: cover("ydGB0BWU7cRoAsduOmtd0waLeo"),
    sections: [
      { heading: "The Shift Towards Human-Centered Cities", body: BODY_1 },
      { heading: "Sustainability as a Core Principle", body: BODY_2 },
    ],
  },
];

export function getArticle(slug: string): ArticleRecord | undefined {
  return articles.find((a) => a.slug === slug);
}
