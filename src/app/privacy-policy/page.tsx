import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { RichText } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/RichText";
import { policySections } from "@/data/sites/norda-framer-website-3f1ea7cb/privacy";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/privacy.module.css";

// Source: https://norda.framer.website/privacy-policy (page key privacy-policy-81e51d8c)
export const metadata: Metadata = { title: "Nordå Architects" };

export default function PrivacyPolicyPage() {
  const [intro, ...sections] = policySections;
  return (
    <main className={s.main}>
      <header className={s.header}>
        <h1 className={cn(site.display, s.title)}>Privacy Policy</h1>
      </header>
      <div className={cn(s.row, s.intro)}>
        <div className={s.number}>
          <span className={site.label}>/&nbsp; {intro.number}</span>
        </div>
        <div className={s.content}>
          {intro.blocks.map((b, i) => (b.type === "p" ? <p key={i} className={cn(site.title, s.lead)}>{b.text}</p> : null))}
        </div>
        <div className={s.side} />
      </div>
      {sections.map((sec) => (
        <section key={sec.number} className={s.row} aria-labelledby={`nd-policy-${sec.number}`}>
          <div className={s.number}>
            <span className={site.label}>/&nbsp; {sec.number}</span>
          </div>
          <div className={s.content}>
            <h2 id={`nd-policy-${sec.number}`} className={cn(site.heading, s.heading)}>
              {sec.heading}
            </h2>
            <RichText blocks={sec.blocks} bullets="disc" className={s.body} />
          </div>
          <div className={s.side} />
        </section>
      ))}
    </main>
  );
}
