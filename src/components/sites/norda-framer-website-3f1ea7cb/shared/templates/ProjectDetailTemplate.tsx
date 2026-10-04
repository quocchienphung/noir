import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ProjectDetail } from "@/data/sites/norda-framer-website-3f1ea7cb/projects";
import { routes } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";
import { Columns } from "../Columns";
import { ParallaxImage } from "../ParallaxImage";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/project-detail.module.css";

/**
 * Shared CMS template for /projects/<slug>. MEASURED (verve-tower at 1440/1024/390): 200px top spacer,
 * display title, framed parallax hero, Location/Year parameters with lead + body, a column of 2–3
 * parallax images, closing lead + body, and a 50vh "Next project" banner.
 */
export function ProjectDetailTemplate({ project, next }: { project: ProjectDetail; next: ProjectDetail }) {
  return (
    <main className={s.main}>
      <div className={s.spacer} aria-hidden="true" />
      <div className={s.titleRow}>
        <h1 className={cn(site.display, s.title)}>{project.name}</h1>
      </div>
      <div className={s.heroRow}>
        <ParallaxImage asset={project.hero.asset} alt={project.hero.alt} className={s.heroFrame} preload />
      </div>

      <Columns plus className={s.description} mainClassName={s.descriptionMain}>
        <dl className={s.params}>
          <div className={s.param}>
            <dt className={site.small}>Location</dt>
            <dd className={site.body}>{project.location}</dd>
          </div>
          <div className={s.param}>
            <dt className={site.small}>Year</dt>
            <dd className={site.body}>{project.year}</dd>
          </div>
        </dl>
        <p className={cn(site.title, s.lead)}>{project.lead}</p>
        <div className={cn(site.body, s.body)}>
          {project.body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </Columns>

      <div className={s.gallery}>
        {project.gallery.map((img, i) => (
          <Columns key={img.asset} plus={i === 0} mainClassName={s.galleryMain}>
            <ParallaxImage
              asset={img.asset}
              alt={img.alt}
              className={s.galleryFrame}
              sizes="(min-width: 1200px) 624px, (min-width: 810px) 60vw, calc(100vw - 48px)"
            />
          </Columns>
        ))}
      </div>

      <Columns plus className={s.closing} mainClassName={s.closingMain}>
        <p className={cn(site.title, s.lead)}>{project.closing.lead}</p>
        <p className={cn(site.body, s.body)}>{project.closing.body}</p>
      </Columns>

      <Link href={routes.project(next.slug)} className={s.next} data-cursor="view-project">
        <ParallaxImage asset={next.hero.asset} alt="" className={s.nextFrame} />
        <span className={s.nextText}>
          <span className={site.label}>Next Project</span>
          <span className={cn(site.display, s.nextName)}>{next.name}</span>
        </span>
      </Link>
    </main>
  );
}
