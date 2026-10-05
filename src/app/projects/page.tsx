import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, PageHeader } from "@/components/noir/sections";
import { routes, services, work } from "@/data/noir/site";
import s from "@/styles/noir/pages.module.css";

export const metadata: Metadata = { title: work.title, description: work.intro };

// `/projects` ("Work"): honest about what can be shown publicly — no invented case studies.
export default function WorkPage() {
  return (
    <main>
      <PageHeader eyebrow="Selected experiments" title={work.title} lead={work.intro} />

      <section className={s.section} aria-label="Experiments">
        <div className={s.inner}>
          <ul className={s.cards}>
            {work.experiments.map((item, i) => (
              <li key={item.id} className={s.card}>
                <div className={s.cardMeta}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>{item.kind}</span>
                  <span>{item.year}</span>
                </div>
                <h2 className={s.cardTitle}>{item.title}</h2>
                <p className={s.cardBody}>{item.body}</p>
                <ul className={s.tags} aria-label="Stack">
                  {item.stack.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                <Link href={item.href} className={s.textLink}>
                  {item.cta}
                  <ArrowIcon direction="right" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={s.section} aria-labelledby="work-capabilities">
        <div className={s.inner}>
          <div className={s.twoCol}>
            <h2 id="work-capabilities" className={s.h2}>
              What we can build for you
            </h2>
            <ul className={s.list}>
              {services.map((service) => (
                <li key={service.id} className={s.listItem}>
                  <h3 className={s.h3}>{service.title}</h3>
                  <p className={s.muted}>{service.summary}</p>
                </li>
              ))}
            </ul>
          </div>
          <p className={s.note}>
            {work.note}{" "}
            <Link href={routes.contact} className={s.inlineLink}>
              Contact
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
