import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { jobHowToApply, jobOffer, type JobRecord } from "@/data/sites/norda-framer-website-3f1ea7cb/jobs";
import { imageAsset } from "@/lib/sites/norda-framer-website-3f1ea7cb/media";
import { routes } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";
import { Columns } from "../Columns";
import { JobList } from "../JobList";
import { ParallaxImage } from "../ParallaxImage";
import { Ticker } from "../Ticker";
import { ArrowRightIcon } from "../icons";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import arrow from "@/styles/sites/norda-framer-website-3f1ea7cb/arrow-link.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/job-detail.module.css";

/**
 * "Apply Now" on the source is a mailto: link to a placeholder address (hello@world.com). External-only,
 * so it is rendered inert with an explanation instead of opening a mail client.
 */
function ApplyNow({ className }: { className?: string }) {
  return (
    <span
      className={cn(arrow.link, arrow.md, arrow.dark, s.apply, className)}
      role="note"
      title="Applications are not handled by this local reconstruction (the source links to an email address)."
    >
      Apply Now
      <ArrowRightIcon className={arrow.arrow} />
    </span>
  );
}

function bold(text: string) {
  return text.split(/(\{[^}]+\})/).map((p, i) => (p.startsWith("{") ? <strong key={i}>{p.slice(1, -1)}</strong> : p));
}

/**
 * Shared CMS template for /jobs/<slug>. MEASURED (interior-designer 1440/1024/390): parallax portrait hero
 * with parameters + title overlaid, description column (groups 128 / 96 / 64 apart), a quote band with the
 * ticker and the quoted co-founder's portrait, and "More Jobs".
 */
export function JobDetailTemplate({ job, others }: { job: JobRecord; others: JobRecord[] }) {
  const portrait = imageAsset(job.quote.portrait.asset);
  return (
    <main className={s.main}>
      <div className={s.hero}>
        <Columns className={s.imageRow}>
          <ParallaxImage asset={job.hero.asset} alt={job.hero.alt} className={s.heroFrame} corners={false} preload sizes="(min-width: 1200px) 624px, (min-width: 810px) 60vw, calc(100vw - 48px)" />
        </Columns>
        <div className={s.info}>
          <dl className={s.params}>
            <div className={s.param}>
              <dt className={site.small}>Location:</dt>
              <dd className={site.body}>{job.location}</dd>
            </div>
            <div className={s.param}>
              <dt className={site.small}>Type:</dt>
              <dd className={site.body}>{job.type}</dd>
            </div>
          </dl>
          <div className={s.titleRow}>
            <h1 className={cn(site.display, s.title)}>{job.title}</h1>
            <ApplyNow className={s.heroApply} />
          </div>
        </div>
      </div>

      <Columns plus className={s.text} mainClassName={s.textMain}>
        <p className={cn(site.title, s.lead)}>{job.intro}</p>
        <div className={s.group}>
          <h2 className={cn(site.label, s.groupTitle)}>/&nbsp; Candidates must</h2>
          <ul className={cn(site.body, s.list)}>
            {job.candidatesMust.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <p className={cn(site.title, s.lead)}>{job.role}</p>
        <div className={s.group}>
          <h2 className={cn(site.label, s.groupTitle)}>/&nbsp; We offer</h2>
          <ul className={cn(site.body, s.list)}>
            {jobOffer.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
        <div className={s.applyGroup}>
          <div className={s.group}>
            <h2 className={cn(site.label, s.groupTitle)}>/&nbsp; How to apply:</h2>
            <p className={cn(site.body, s.lead)}>{bold(jobHowToApply)}</p>
          </div>
          <ApplyNow />
        </div>
      </Columns>

      <section className={s.quote} aria-label="Quote">
        <Ticker text="Nordå Architects ~" className={s.ticker} />
        <figure className={s.figure}>
          <blockquote className={s.blockquote}>
            <p className={cn(site.title, s.quoteText)}>{job.quote.text}</p>
          </blockquote>
          <figcaption className={site.body}>{job.quote.author}</figcaption>
        </figure>
        <div className={s.portraitCol}>
          <Link href={routes.team(job.quote.teamSlug)} className={s.portrait} aria-label={job.quote.author.replace(/^–\s*/, "")}>
            <Image src={portrait.src} alt={job.quote.portrait.alt} fill sizes="(min-width: 810px) 280px, 100vw" className={s.portraitImg} />
          </Link>
        </div>
      </section>

      <Columns plus as="section" className={s.jobs} mainClassName={s.jobsMain}>
        <h2 className={cn(site.display, s.jobsTitle)}>More Jobs</h2>
        <JobList jobs={others} />
      </Columns>
    </main>
  );
}
