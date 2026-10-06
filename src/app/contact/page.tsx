import type { Metadata } from "next";
import { PageHeader } from "@/components/noir/sections";
import { ContactForm } from "@/components/noir/ContactForm";
import { contact, process } from "@/data/noir/site";
import s from "@/styles/noir/pages.module.css";

export const metadata: Metadata = { title: "Contact", description: contact.lead };

export default function ContactPage() {
  return (
    <main>
      <PageHeader eyebrow="Contact" title={contact.title} lead={contact.lead} />
      <section className={s.section} aria-label="Project enquiry">
        <div className={s.inner}>
          <div className={s.formLayout} data-m-group="">
            <ContactForm />
            <aside className={s.aside} aria-label="What happens next" data-m="block">
              <h2 className={s.h3}>What happens next</h2>
              <ol className={s.nextSteps}>
                {process.slice(0, 3).map((step) => (
                  <li key={step.id}>
                    <strong>{step.title}.</strong> {step.body}
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
