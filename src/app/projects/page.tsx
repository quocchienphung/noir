import type { Metadata } from "next";
import { PageHeader } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/PageHeader";
import { InnerMain, LeadText } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/InnerMain";
import { RecordList } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/RecordList";
import { ProjectStack } from "@/components/sites/norda-framer-website-3f1ea7cb/projects-902ceeb2/ProjectStack";
import { archiveProjects, projectCards, projectsHeader, projectsIntro, projectsOutro } from "@/data/sites/norda-framer-website-3f1ea7cb/projects";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/projects-902ceeb2/projects.module.css";

// Source route: /projects (page key projects-902ceeb2)
export const metadata: Metadata = { title: "Nordå Architects" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader image={projectsHeader.image} intro={projectsHeader.intro} title={projectsHeader.title} />
      <InnerMain>
        <LeadText lead={projectsIntro.lead} body={projectsIntro.body} className={s.intro} />
        <ProjectStack projects={projectCards}>
          <section className={s.archive} aria-labelledby="nd-archive-title">
            <RecordList id="nd-archive-title" title="Archive Projects" rows={archiveProjects.map((r) => ({ ...r, cursor: "none" }))} />
          </section>
        </ProjectStack>
        <LeadText lead={projectsOutro.lead} body={projectsOutro.body} />
      </InnerMain>
    </>
  );
}
