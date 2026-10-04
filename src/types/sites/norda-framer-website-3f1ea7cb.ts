// Content, asset and interaction contracts for the Nordå reconstruction.

export type MediaKind = "image" | "vector" | "video";

export interface MediaAsset {
  src: string;
  kind: MediaKind;
  width?: number;
  height?: number;
}

export interface ImageRef {
  /** Key in the generated asset map. */
  asset: string;
  alt: string;
}

export interface NavLink {
  label: string;
  href: string;
}

/** Rich text block: paragraphs, headings and dash-prefixed list items, as authored on the source. */
export type RichBlock =
  | { type: "p"; text: string; strong?: string[] }
  | { type: "h2" | "h3" | "h4"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "img"; image: ImageRef }
  | { type: "quote"; text: string };

export interface ProjectRecord {
  slug: string;
  name: string;
  /** Short location / year meta shown on cards and detail pages. */
  meta: Record<string, string>;
  cover: ImageRef;
  gallery: ImageRef[];
  intro: string;
  body: RichBlock[];
}

export interface TeamMember {
  slug: string;
  name: string;
  role: string;
  portrait: ImageRef;
  bio: RichBlock[];
  meta: Record<string, string>;
}

export interface ArticleRecord {
  slug: string;
  title: string;
  date: string;
  category: string;
  cover: ImageRef;
  excerpt: string;
  body: RichBlock[];
}

export interface JobRecord {
  slug: string;
  title: string;
  meta: Record<string, string>;
  cover: ImageRef;
  body: RichBlock[];
}

export interface Award {
  title: string;
  organisation: string;
  year: string;
  preview: ImageRef;
}

export interface ServiceStep {
  number: string;
  title: string;
  body: RichBlock[];
}

export interface Testimonial {
  quote: string;
  author: string;
  portrait: ImageRef;
}

export interface Counter {
  value: number;
  label: string;
}

export type CursorVariant = "none" | "view-project" | "read-article" | `award-${number}`;
