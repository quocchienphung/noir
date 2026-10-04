import { cn } from "@/lib/utils";
import { serviceSteps, services } from "@/data/sites/norda-framer-website-3f1ea7cb/home";
import { Columns } from "../shared/Columns";
import { ParallaxImage } from "../shared/ParallaxImage";
import { ServicesAccordion } from "./ServicesAccordion";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/services.module.css";

export function ServicesSection() {
  return (
    <section className={s.services} aria-labelledby="nd-services-title">
      <Columns plus className={s.titleRow} mainClassName={s.titleMain}>
        <h2 id="nd-services-title" className={cn(site.display, s.title)}>
          {services.title}
        </h2>
        <p className={cn(site.body, s.intro)}>{services.intro}</p>
      </Columns>
      <div className={s.imageRow}>
        <ParallaxImage asset={services.image.asset} alt={services.image.alt} className={s.imageFrame} />
      </div>
      <div className={s.accordionWrap}>
        <ServicesAccordion steps={serviceSteps} />
      </div>
    </section>
  );
}
