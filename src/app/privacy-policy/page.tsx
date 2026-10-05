import type { Metadata } from "next";
import { PageHeader } from "@/components/noir/sections";
import { privacy } from "@/data/noir/privacy";
import s from "@/styles/noir/pages.module.css";

export const metadata: Metadata = { title: privacy.title, description: privacy.sections[0].body[0] };

export default function PrivacyPolicyPage() {
  return (
    <main>
      <PageHeader eyebrow={`Last updated ${privacy.updated}`} title={privacy.title} />
      <section className={s.section} aria-label="Policy">
        <div className={s.inner}>
          <div className={s.legal}>
            {privacy.sections.map((section) => (
              <section key={section.heading} className={s.legalSection}>
                <h2 className={s.h3}>{section.heading}</h2>
                {section.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
