// Single source of truth for local destinations. Source pathnames are preserved exactly
// (including percent-encoded Unicode slugs such as /team/linnea-s%C3%B6rensen).

export const routes = {
  home: "/",
  projects: "/projects",
  project: (slug: string) => `/projects/${encodeURIComponent(slug)}`,
  about: "/about",
  team: (slug: string) => `/team/${encodeURIComponent(slug)}`,
  news: "/news",
  article: (slug: string) => `/news/${encodeURIComponent(slug)}`,
  job: (slug: string) => `/jobs/${encodeURIComponent(slug)}`,
  contact: "/contact",
  privacy: "/privacy-policy",
  notFound: "/404",
} as const;

/** Decodes a dynamic segment from Next params (which may arrive encoded or decoded). */
export function decodeSlug(segment: string): string {
  try {
    return decodeURIComponent(segment).normalize("NFC");
  } catch {
    return segment.normalize("NFC");
  }
}
