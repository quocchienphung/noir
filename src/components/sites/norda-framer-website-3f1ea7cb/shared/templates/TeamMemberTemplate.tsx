import Image from "next/image";
import { cn } from "@/lib/utils";
import type { TeamRecord } from "@/data/sites/norda-framer-website-3f1ea7cb/team";
import { imageAsset } from "@/lib/sites/norda-framer-website-3f1ea7cb/media";
import { routes } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";
import { ArrowLink } from "../ArrowLink";
import { Columns } from "../Columns";
import { ArrowDownIcon } from "../icons";
import { RollText } from "../RollText";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/team-member.module.css";

/**
 * Shared CMS template for /team/<slug> (dark page). MEASURED (erik-lindholm 1440/1024/390): portrait in the
 * main column (900 / 640 / 400 tall) with the name + role overlaid bottom-left on wide layouts, then the
 * bio lead, Education / Recognition lists and a "Meet the Team" link back to /about#meet-the-team.
 */
export function TeamMemberTemplate({ member }: { member: TeamRecord }) {
  const img = imageAsset(member.portrait.asset);
  return (
    <main id="main-container" className={s.main}>
      <div className={s.hero}>
        <Columns className={s.imageRow}>
          <div className={s.portrait}>
            <Image src={img.src} alt={member.portrait.alt} fill sizes="(min-width: 1200px) 624px, (min-width: 810px) 60vw, calc(100vw - 48px)" preload className={s.photo} />
          </div>
        </Columns>
        <div className={s.nameRole}>
          <div className={s.text}>
            <h1 className={cn(site.display, s.name)}>{member.name}</h1>
            <p className={cn(site.title, s.role)}>{member.role}</p>
          </div>
          <a href="#main-container" className={s.scroll}>
            <ArrowDownIcon className={s.scrollIcon} />
            <RollText text="SCROLL" className={site.label} />
          </a>
        </div>
      </div>

      <Columns plus as="section" className={s.info} mainClassName={s.infoMain}>
        <p className={cn(site.title, s.bio)}>{member.bio}</p>
        <InfoList title="Education" items={member.education} />
        <InfoList title="Recognition" items={member.recognition} />
        <ArrowLink href={`${routes.about}#meet-the-team`} label="Meet the Team" size="md" tone="light" />
      </Columns>
    </main>
  );
}

function InfoList({ title, items }: { title: string; items: { year: string; text: string }[] }) {
  return (
    <div className={s.group}>
      <h2 className={cn(site.label, s.groupTitle)}>/&nbsp; {title}</h2>
      <div className={cn(site.body, s.groupBody)}>
        {items.map((it) => (
          <p key={it.year + it.text}>
            <strong>{it.year}: </strong>
            {it.text}
          </p>
        ))}
      </div>
    </div>
  );
}
