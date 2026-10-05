import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TeamMemberTemplate } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/TeamMemberTemplate";
import { getTeamMember, team } from "@/data/sites/norda-framer-website-3f1ea7cb/team";
import { decodeSlug } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";

// Source route: /team/<slug> — nine CMS entries (Unicode slugs preserved), unknown slugs 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return team.map((m) => ({ slug: m.slug }));
}

export const metadata: Metadata = { title: "Nordå Architects" };

export default async function TeamMemberPage({ params }: PageProps<"/team/[slug]">) {
  const member = getTeamMember(decodeSlug((await params).slug));
  if (!member) notFound();
  return <TeamMemberTemplate member={member} />;
}
