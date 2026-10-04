import type { Metadata } from "next";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/PageHeader";
import { InnerMain, LeadText } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/InnerMain";
import { Columns } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/Columns";
import { FitText } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/FitText";
import { ParallaxImage } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/ParallaxImage";
import { ArrowRightIcon } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/icons";
import { ContactForm } from "@/components/sites/norda-framer-website-3f1ea7cb/contact-4eb95063/ContactForm";
import { contactClosing, contactDetails, contactHeader, contactHeading, contactImage } from "@/data/sites/norda-framer-website-3f1ea7cb/contact";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import arrow from "@/styles/sites/norda-framer-website-3f1ea7cb/arrow-link.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/contact-4eb95063/contact.module.css";

// Source: https://norda.framer.website/contact (page key contact-4eb95063)
export const metadata: Metadata = { title: "Nordå Architects" };

export default function ContactPage() {
  return (
    <>
      <PageHeader image={contactHeader.image} intro={contactHeader.intro} title={contactHeader.title} tone="dark" />
      <InnerMain tone="dark">
        <Columns plus className={s.formRow} mainClassName={s.formMain}>
          <h2 className={cn(site.heading, s.heading)}>{contactHeading}</h2>
          <ContactForm />
        </Columns>

        <section className={s.infoRow} aria-label="Contact details">
          <div className={s.info}>
            {contactDetails.map((d) => (
              <div key={d.label} className={s.detail}>
                <p className={cn(site.body, s.detailLabel)}>{d.label}</p>
                <p className={cn(site.heading, s.detailValue)}>{d.value}</p>
              </div>
            ))}
            {/* External-only on the source (maps.google.com); kept as an inert, labelled control. */}
            <span
              className={cn(arrow.link, arrow.md, arrow.light, s.maps)}
              role="note"
              title="External map link not included in this local reconstruction."
            >
              Google Maps
              <ArrowRightIcon className={arrow.arrow} />
            </span>
          </div>
          <div className={s.city} aria-hidden="true">
            <FitText lines={["STO", "CKH", "OLM"]} viewBox="0 0 516.4 595" fontSize={248} letterSpacing="-0.05em" lineHeight="80%" className={s.citySvg} />
          </div>
          <Columns className={s.imageCols}>
            <ParallaxImage asset={contactImage.asset} alt={contactImage.alt} className={s.imageFrame} sizes="(min-width: 1200px) 624px, (min-width: 810px) 60vw, calc(100vw - 48px)" />
          </Columns>
        </section>

        <LeadText lead={contactClosing.lead} body={contactClosing.body} className={s.closing} />
      </InnerMain>
    </>
  );
}
