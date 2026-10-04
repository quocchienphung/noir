import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/PageHeader";
import { InnerMain, LeadText } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/InnerMain";
import { ArrowLink } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/ArrowLink";
import { Columns } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/Columns";
import { JobList } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/JobList";
import { ParallaxImage } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/ParallaxImage";
import { RecordList } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/RecordList";
import { MeetTheTeam } from "@/components/sites/norda-framer-website-3f1ea7cb/about-979bddc4/MeetTheTeam";
import { RotatingBadge } from "@/components/sites/norda-framer-website-3f1ea7cb/about-979bddc4/RotatingBadge";
import {
  aboutBadgeText,
  aboutClosing,
  aboutHeader,
  aboutIntro,
  aboutOfficeImage,
  aboutTeamImage,
  publications,
} from "@/data/sites/norda-framer-website-3f1ea7cb/about";
import { jobs } from "@/data/sites/norda-framer-website-3f1ea7cb/jobs";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/about-979bddc4/about.module.css";

// Source: https://norda.framer.website/about (page key about-979bddc4)
export const metadata: Metadata = { title: "Nordå Architects" };

export default function AboutPage() {
  return (
    <>
      <PageHeader
        image={aboutHeader.image}
        objectPosition={aboutHeader.objectPosition}
        intro={aboutHeader.intro}
        title={aboutHeader.title}
        tone="dark"
      />
      <InnerMain tone="dark">
        <Columns plus className={s.intro} mainClassName={s.introMain}>
          <p className={cn(site.title, s.lead)}>{aboutIntro.lead}</p>
          <p className={cn(site.body, s.lead)}>{aboutIntro.body}</p>
          <ArrowLink href="#job-openings" label="Join Us" size="lg" tone="light" icon="down-right" />
        </Columns>

        <div className={s.imageRow}>
          <ParallaxImage asset={aboutTeamImage.asset} alt={aboutTeamImage.alt} className={s.imageFrame}>
            <RotatingBadge text={aboutBadgeText} id="nd-badge-curve" />
          </ParallaxImage>
        </div>

        <MeetTheTeam />

        <section className={s.publications} aria-labelledby="nd-publications-title">
          <RecordList
            id="nd-publications-title"
            title="Selected Printed Publications"
            rows={publications}
            tone="light"
            showCount={false}
            appear="rows"
            thickLines
            titleAppear={false}
            variant="publications"
          />
        </section>

        <LeadText lead={aboutClosing.lead} body={aboutClosing.body} className={s.closing} />

        <div className={s.imageRow}>
          <ParallaxImage asset={aboutOfficeImage.asset} alt={aboutOfficeImage.alt} className={s.imageFrame} />
        </div>

        <Columns plus as="section" className={s.jobs} mainClassName={s.jobsMain}>
          <h2 id="job-openings" className={cn(site.display, s.jobsTitle)}>
            Join Our Team
          </h2>
          <JobList jobs={jobs} tone="light" />
        </Columns>
      </InnerMain>
    </>
  );
}
