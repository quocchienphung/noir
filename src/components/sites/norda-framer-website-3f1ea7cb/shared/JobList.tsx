import Link from "next/link";
import { cn } from "@/lib/utils";
import type { JobRecord } from "@/data/sites/norda-framer-website-3f1ea7cb/jobs";
import { routes } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";
import { ArrowRightIcon } from "./icons";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/job-list.module.css";

/**
 * Vacancy list (About "Join Our Team", job pages "More Jobs").
 * MEASURED: item padding-top 32, title row (36px title + 36px arrow disc) then 14px summary (gap 8),
 * 32px to a 10% hairline; on hover the disc fills with the text colour and the arrow inverts.
 */
export function JobList({ jobs, tone = "dark" }: { jobs: JobRecord[]; tone?: "dark" | "light" }) {
  return (
    <ul className={cn(s.list, tone === "light" && s.light)}>
      {jobs.map((job) => (
        <li key={job.slug}>
          <Link href={routes.job(job.slug)} className={s.item}>
            <span className={s.container}>
              <span className={s.titleRow}>
                <span className={site.title}>{job.title}</span>
                <span className={s.arrow} aria-hidden="true">
                  <span className={s.disc} />
                  <ArrowRightIcon className={s.arrowIcon} />
                </span>
              </span>
              <span className={cn(site.small, s.summary)}>{job.summary}</span>
            </span>
            <span className={s.line} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
