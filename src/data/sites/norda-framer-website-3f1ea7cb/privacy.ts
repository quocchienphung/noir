// Privacy policy, verbatim from the source route /privacy-policy (captured 2026-10-04).
// "{…}" marks runs set in bold on the source; "\n\n" reproduces an authored trailing blank line.
import type { RichBlock } from "@/types/sites/norda-framer-website-3f1ea7cb";

export interface PolicySection {
  number: string;
  heading?: string;
  blocks: RichBlock[];
}

export const policySections: PolicySection[] = [
  {
    number: "00",
    blocks: [
      {
        type: "p",
        text: "At Nordå, we are committed to safeguarding your privacy and ensuring a safe online experience. This privacy policy outlines how we collect, use, and protect your personal information when you use our services.",
      },
    ],
  },
  {
    number: "01",
    blocks: [
      { type: "p", text: "When you interact with us through our contact form, we collect the following personal information:" },
      {
        type: "ul",
        items: ["{Name}", "{Email address}", "{Phone number}", "Any other information you choose to provide through the contact form"],
      },
    ],
    heading: "Data We Collect",
  },
  {
    number: "02",
    blocks: [
      {
        type: "p",
        text: "We use the information you provide to respond to inquiries, process requests, and offer the services you require.",
      },
    ],
    heading: "How We Use Your Data",
  },
  {
    number: "03",
    blocks: [
      {
        type: "p",
        text: "We value your privacy and will never sell or share your personal data with third parties without your explicit consent, except in the following circumstances:",
      },
      {
        type: "ul",
        items: [
          "{Service Providers}: We may share your information with trusted third-party service providers (such as our CRM platform) who assist us in managing and operating our services.\n\n",
          "{Legal Compliance}: If required by law, we may disclose your information to comply with legal obligations, respond to court orders, or protect our rights.",
        ],
      },
    ],
    heading: "Sharing of Data",
  },
  {
    number: "04",
    blocks: [
      {
        type: "p",
        text: "We take the security of your personal data seriously. To protect your information from unauthorized access, alteration, or destruction, we implement industry-standard security measures including encryption and secure storage.",
      },
      {
        type: "p",
        text: "Our third-party CRM provider follows security protocols to ensure your data is handled safely and securely. However, no data transmission over the internet is 100% secure, and while we strive to protect your personal information, we cannot guarantee complete security.",
      },
    ],
    heading: "Security Measures",
  },
  {
    number: "05",
    blocks: [
      {
        type: "p",
        text: "You have the right to access, update, or delete the personal data we have collected. If you believe the information we have is incorrect or incomplete, please contact us, and we will make the necessary corrections.",
      },
      { type: "p", text: "To request access to your data or exercise any of your rights, please email us at {hello@norda.com.}" },
    ],
    heading: "Access and Correction of Data",
  },
  {
    number: "06",
    blocks: [
      {
        type: "p",
        text: "We will retain your personal information only for as long as necessary to fulfill the purposes outlined in this privacy policy, or as required by law.",
      },
    ],
    heading: "Retention of Data",
  },
  {
    number: "07",
    blocks: [
      {
        type: "p",
        text: "Our website uses cookies and similar tracking technologies to improve the user experience. Cookies help us personalize your visit, track website usage, and analyze trends. You can control the use of cookies through your browser settings. If you choose to disable cookies, some features of our website may not function properly.",
      },
    ],
    heading: "Cookies and Tracking Technologies",
  },
  {
    number: "08",
    blocks: [
      {
        type: "p",
        text: "We may update this privacy policy periodically to reflect changes in our practices, legal requirements, or services. Any updates will be posted on this page, and the updated date will be reflected at the top of the policy.",
      },
      {
        type: "p",
        text: "By continuing to use our website or services after any changes to the privacy policy, you accept and agree to the updated terms.",
      },
    ],
    heading: "Changes to This Privacy Policy",
  },
  {
    number: "09",
    blocks: [
      {
        type: "p",
        text: "If you have any questions or concerns regarding this privacy policy or how we handle your personal information, please do not hesitate to reach out to us at {hello@norda.com.}",
      },
    ],
    heading: "Contact Us",
  },
];
