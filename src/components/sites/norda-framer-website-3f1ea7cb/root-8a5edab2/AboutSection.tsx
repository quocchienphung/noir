import { cn } from "@/lib/utils";
import { counters, intro, leadership, studioImage } from "@/data/sites/norda-framer-website-3f1ea7cb/home";
import { routes } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";
import { ArrowLink } from "../shared/ArrowLink";
import { CharReveal } from "../shared/CharReveal";
import { Columns } from "../shared/Columns";
import { ParallaxImage } from "../shared/ParallaxImage";
import { Counters } from "./Counters";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/about.module.css";

/** Renders "{Name}" tokens in leadership copy as bold, matching the source's <strong> runs. */
function withStrong(text: string) {
  return text.split(/(\{[^}]+\})/).map((part, i) =>
    part.startsWith("{") ? <strong key={i}>{part.slice(1, -1)}</strong> : part,
  );
}

export function AboutSection() {
  return (
    <div className={s.about}>
      <Columns plus className={s.intro} mainClassName={s.introMain}>
        {/* MEASURED: desktop-only character reveal, 100ms per line, on entering the viewport. */}
        <CharReveal as="h2" text={intro.heading.join("\n")} className={cn(site.heading, s.introHeading)} />
        <p className={cn(site.body, s.introBody)}>{intro.body}</p>
      </Columns>

      <Columns className={s.countersRow} mainClassName={s.countersMain}>
        <Counters rows={counters} />
      </Columns>

      <div className={s.imageRow}>
        <ParallaxImage asset={studioImage.asset} alt={studioImage.alt} className={s.imageFrame} />
      </div>

      <Columns plus className={s.leadership} mainClassName={s.leadershipMain}>
        <div className={cn(site.body, s.leadershipBody)}>
          {leadership.paragraphs.map((p, i) => (
            <p key={i}>{withStrong(p)}</p>
          ))}
        </div>
        <ArrowLink href={routes.about} label="About" size="lg" />
      </Columns>
    </div>
  );
}
