import type { Metadata } from "next";
import { ButtonLink, PageHeader } from "@/components/noir/sections";
import { NoirPrinciples, NoirProcess } from "@/components/noir/sections";
import { NoirMark } from "@/components/noir/brand";
import { about, routes } from "@/data/noir/site";
import s from "@/styles/noir/pages.module.css";

export const metadata: Metadata = { title: about.title, description: about.lead };

export default function AboutPage() {
  return (
    <main>
      <PageHeader eyebrow="Studio" title={about.title} lead={about.lead} />

      <section className={s.section} aria-label="Studio">
        <div className={s.inner}>
          <div className={s.twoCol}>
            <div className={s.markPanel} aria-hidden="true">
              <NoirMark size={320} className={s.markPanelImg} />
            </div>
            <div className={s.prose}>
              {about.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <div className={s.actions}>
                <ButtonLink href={routes.contact}>Start a project</ButtonLink>
                <ButtonLink href={routes.work} variant="ghost">
                  Explore work
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <NoirProcess />

      <section className={s.section} aria-labelledby="about-stack">
        <div className={s.inner}>
          <h2 id="about-stack" className={s.h2}>
            {about.stackTitle}
          </h2>
          <div className={s.stackGrid}>
            {about.stack.map((group) => (
              <div key={group.group} className={s.stackGroup}>
                <h3 className={s.h3}>{group.group}</h3>
                <ul className={s.tags}>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className={s.note}>{about.stackNote}</p>
        </div>
      </section>

      <NoirPrinciples />
    </main>
  );
}
