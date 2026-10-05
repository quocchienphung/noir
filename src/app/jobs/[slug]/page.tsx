import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JobDetailTemplate } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/JobDetailTemplate";
import { getJob, jobs } from "@/data/sites/norda-framer-website-3f1ea7cb/jobs";
import { decodeSlug } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";

// Source route: /jobs/<slug> — four CMS entries, unknown slugs 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return jobs.map((j) => ({ slug: j.slug }));
}

export const metadata: Metadata = { title: "Nordå Architects" };

export default async function JobPage({ params }: PageProps<"/jobs/[slug]">) {
  const job = getJob(decodeSlug((await params).slug));
  if (!job) notFound();
  return <JobDetailTemplate job={job} others={jobs.filter((j) => j.slug !== job.slug)} />;
}
