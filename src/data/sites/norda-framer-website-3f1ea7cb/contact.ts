// Contact page content, verbatim from the source route /contact (captured 2026-10-04).
import type { ImageRef } from "@/types/sites/norda-framer-website-3f1ea7cb";
import type { PageTitleSpec } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/PageHeader";

export const contactHeader = {
  image: { asset: "l8RTWOrUWpyhGGNwvxfwfsQ8Uv0", alt: "Nordå" } satisfies ImageRef,
  intro:
    "Let’s connect. Whether you have a project in mind or want to learn more about our work, we’re here to talk. Reach out to discuss ideas or explore potential collaborations.",
  title: {
    text: "Contact",
    viewBoxWidth: { desktop: 515.0134880922842, tablet: 524.4401326505292, phone: 533.8667772087744 },
    viewBoxHeight: 173,
    fontSize: 157.33554417548785,
    boxRatio: 4.61,
  } satisfies PageTitleSpec,
};

export const contactHeading = "We’d love to hear from you.";

/** `externalNote`: the source links these values to placeholder mailto:/tel: targets (external-only). */
export const contactDetails: { label: string; value: string; externalNote?: string }[] = [
  { label: "Email:", value: "hello@norda.com", externalNote: "Email link not included in this local reconstruction." },
  { label: "Phone:", value: "+23 347 75 868", externalNote: "Phone link not included in this local reconstruction." },
  { label: "Address:", value: "Fjällgatan 12 SE-111 28 Stockholm, Sweden" },
];

export const contactImage: ImageRef = { asset: "sT0mMktrf0wSFPu8VqmYq2sBRI", alt: "Parallax Image" };

export const contactClosing = {
  lead: "Together, we merge innovation with tradition, delivering spaces that honor their surroundings while meeting modern needs with precision and care.",
  body: "We stand by principles of timeless design, sustainable practices, and a commitment to quality at every stage. With decades of experience and a reputation for excellence, Nordå is a trusted partner for those seeking meaningful, lasting architectural solutions.",
};
