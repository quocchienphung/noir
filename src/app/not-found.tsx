import type { Metadata } from "next";
import { NotFoundView } from "@/components/sites/norda-framer-website-3f1ea7cb/404-316556f0/NotFoundView";

// Fallback for unknown paths and unknown CMS slugs (source: https://norda.framer.website/404).
export const metadata: Metadata = { title: "Nordå Architects" };

export default function NotFound() {
  return <NotFoundView />;
}
