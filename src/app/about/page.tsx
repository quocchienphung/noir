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
            <div className={s.markPanel} aria-hidden="true" data-m="visual">
              <NoirMark size={320} className={s.markPanelImg} />
            </div>
            <div className={s.prose} data-m-group="">
              {about.body.map((p) => (
                <p key={p} data-m="block">
                  {p}
                </p>
              ))}
              <div className={s.actions} data-m="block">
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
          <h2 id="about-stack" className={s.h2} data-m="block">
            {about.stackTitle}
          </h2>
          <div className={s.stackGrid} data-m-group="">
            {about.stack.map((group) => (
              <div key={group.group} className={s.stackGroup} data-m="item">
                <h3 className={s.h3}>{group.group}</h3>
                <ul className={s.tags}>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className={s.note} data-m="block">
            {about.stackNote}
          </p>
        </div>
      </section>

      <NoirPrinciples />
    </main>
  );
}
