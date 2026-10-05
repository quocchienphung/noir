import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetailTemplate } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/ProjectDetailTemplate";
import { getProject, projectDetails } from "@/data/sites/norda-framer-website-3f1ea7cb/projects";
import { decodeSlug } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";

// Source route: /projects/<slug> — five CMS entries, unknown slugs 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return projectDetails.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const project = getProject(decodeSlug((await params).slug));
  return project ? { title: project.pageTitle } : {};
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const project = getProject(decodeSlug((await params).slug));
  if (!project) notFound();
  const next = getProject(project.next);
  if (!next) notFound();
  return <ProjectDetailTemplate project={project} next={next} />;
}
