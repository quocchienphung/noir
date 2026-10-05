// Single source of truth for NOIR brand strings, navigation and page copy.
// Everything here is neutral, factual copy about the kind of work NOIR takes on. There are deliberately
// no clients, awards, counters, testimonials or case studies: add real ones here when they exist.

export const brand = {
  name: "NOIR",
  tagline: "Digital experiences. Built with depth.",
  description:
    "NOIR is an independent studio for websites, web applications, cloud infrastructure, DevOps, automation and API integrations.",
  year: 2026,
  mark: {
    light: "/sites/noir/brand/noir-mark-light",
    dark: "/sites/noir/brand/noir-mark-dark",
    small: "/sites/noir/brand/noir-mark-small",
  },
};

export const routes = {
  home: "/",
  work: "/projects",
  about: "/about",
  contact: "/contact",
  privacy: "/privacy-policy",
} as const;

export interface NavItem {
  label: string;
  href: string;
}

export const primaryNav: NavItem[] = [
  { label: "Home", href: routes.home },
  { label: "Work", href: routes.work },
  { label: "About", href: routes.about },
  { label: "Contact", href: routes.contact },
];

export const footerNav: NavItem[] = [...primaryNav, { label: "Privacy", href: routes.privacy }];

/**
 * Where enquiries go. No real inbox or form backend exists in this repository, so the contact form
 * reports honestly that nothing was sent. Set `email` (and wire `endpoint`) to make it live.
 */
export const contactDestination: { email: string | null; endpoint: string | null } = {
  email: null,
  endpoint: null,
};

export interface Service {
  id: string;
  title: string;
  summary: string;
  items: string[];
}

export const services: Service[] = [
  {
    id: "web-experiences",
    title: "Web Experiences",
    summary:
      "Marketing sites, launches and interactive stories with motion, WebGL and real performance budgets — fast on a phone, not just on a studio monitor.",
    items: ["Design-to-code builds", "Motion & WebGL", "Headless CMS", "Accessibility & SEO foundations"],
  },
  {
    id: "web-applications",
    title: "Web Applications",
    summary:
      "Product interfaces and the back ends behind them: dashboards, portals, internal tools and SaaS features, with typed APIs and tests that make change safe.",
    items: ["React & Next.js", "TypeScript APIs", "Auth & roles", "Data modelling"],
  },
  {
    id: "cloud-infrastructure",
    title: "Cloud & Infrastructure",
    summary:
      "Infrastructure as code, CI/CD and observability so releases are routine. Right-sized hosting on managed platforms or your own cloud account.",
    items: ["Infrastructure as code", "CI/CD pipelines", "Containers", "Monitoring & alerting"],
  },
  {
    id: "integrations-automation",
    title: "Integrations & Automation",
    summary:
      "Connect the tools you already pay for. API integrations, webhooks, background jobs and scripted workflows that remove repetitive manual work.",
    items: ["REST & GraphQL", "Webhooks & queues", "Scheduled jobs", "Data sync"],
  },
  {
    id: "technical-direction",
    title: "Technical Direction",
    summary:
      "Architecture reviews, audits and hands-on guidance for teams who need a second pair of senior eyes before — or after — a big decision.",
    items: ["Architecture review", "Performance audits", "Security hygiene", "Roadmaps & estimates"],
  },
];

export interface ProcessStep {
  id: string;
  title: string;
  body: string;
}

export const process: ProcessStep[] = [
  { id: "discover", title: "Discover", body: "Goals, constraints, users and the systems already in place. We agree on what success measurably looks like." },
  { id: "architect", title: "Architect", body: "Structure, stack and interfaces are decided early and written down, so the build has no surprises." },
  { id: "build", title: "Build", body: "Short iterations on a live preview. You see working software every week, not slides." },
  { id: "launch", title: "Launch", body: "Automated deploys, monitoring and a rollback plan. Launch day should be uneventful." },
  { id: "evolve", title: "Evolve", body: "Measure, maintain and improve — or hand over cleanly with documentation your team can own." },
];

export const principles = [
  { title: "Depth over decoration", body: "Every visual effect earns its place and ships within a performance budget." },
  { title: "Systems, not pages", body: "Components, data and infrastructure are designed together, so the product can grow." },
  { title: "Plain communication", body: "Clear estimates, honest trade-offs and written decisions. No jargon as a shield." },
];

export const home = {
  capabilities: {
    eyebrow: "What NOIR does",
    title: "From the interface people touch to the infrastructure they never see.",
    body: "NOIR takes on code-driven projects end to end: design-led frontends, application back ends, cloud platforms, deployment pipelines and the integrations that tie them together.",
    pillars: ["Frontend", "Backend", "Cloud", "DevOps", "Automation", "APIs"],
  },
  cinematic: {
    eyebrow: "Event horizon",
    statement: ["Complexity", "pulled into", "a single orbit."],
    caption: "One partner for interface, application and infrastructure — so nothing falls between the cracks.",
  },
  servicesIntro: {
    eyebrow: "Services",
    title: "Five ways to work together.",
  },
  processIntro: {
    eyebrow: "Process",
    title: "Discover → Architect → Build → Launch → Evolve",
  },
  principlesIntro: {
    eyebrow: "Principles",
  },
  cta: {
    title: "Have a project with some depth to it?",
    body: "Tell us what you are building. You will get a considered reply, not an automated sequence.",
    primary: { label: "Start a project", href: routes.contact },
    secondary: { label: "Explore work", href: routes.work },
  },
};

export const work = {
  title: "Work",
  intro:
    "NOIR is a new studio, and client work is published only with permission. Rather than invent case studies, this page shows what we can demonstrate openly today.",
  experiments: [
    {
      id: "event-horizon-renderer",
      title: "Event-horizon renderer",
      kind: "Real-time WebGL2",
      year: "2026",
      body: "The black hole on this site is ray-traced live in your browser: photon paths are integrated through Schwarzschild spacetime, the accretion disk is shaded with Doppler beaming and gravitational redshift, and an HDR bloom chain finishes the frame. It adapts its resolution to your device and pauses off-screen.",
      stack: ["WebGL2", "GLSL", "TypeScript", "React 19"],
      href: routes.home,
      cta: "See it on the home page",
    },
    {
      id: "this-site",
      title: "This website",
      kind: "Next.js 16 · App Router",
      year: "2026",
      body: "Server-rendered pages, a scroll-driven intro with smoothed, reversible progress, layout-derived section states that survive refreshes and Back/Forward, and automated route and invariant tests.",
      stack: ["Next.js 16", "React 19", "CSS Modules", "Playwright"],
      href: routes.about,
      cta: "How we work",
    },
  ],
  note: "Want to see private work? Ask on the contact page — we can walk through relevant projects on a call where permissions allow.",
};

export const about = {
  title: "About",
  lead: "NOIR is an independent studio for code-heavy digital work: the kind of project where the interface, the application and the infrastructure have to be designed together.",
  body: [
    "We work directly with founders, product teams and agencies. Projects range from a single high-craft marketing site to multi-service platforms with their own deployment pipelines.",
    "The studio is deliberately small. You talk to the people who write the code, decisions are documented, and everything we build is yours — repository, infrastructure and credentials included.",
  ],
  stackTitle: "Typical stack",
  stack: [
    { group: "Frontend", items: ["TypeScript", "React", "Next.js", "WebGL / Three.js", "CSS & motion"] },
    { group: "Backend", items: ["Node.js", "REST & GraphQL", "PostgreSQL", "Queues & jobs"] },
    { group: "Cloud & DevOps", items: ["Infrastructure as code", "Containers", "CI/CD", "Observability"] },
  ],
  stackNote: "The stack follows the problem. These are defaults, not rules.",
};

export const contact = {
  title: "Start a project",
  lead: "Share a few details and we will reply with questions, a rough approach and next steps.",
  projectTypes: [
    "Website",
    "Web application",
    "Cloud & infrastructure",
    "Integrations & automation",
    "Technical direction",
    "Something else",
  ],
  budgets: ["Not sure yet", "Under $10k", "$10k–$30k", "$30k–$75k", "$75k+"],
  notSent: {
    title: "Your message was not sent.",
    body: "This site does not have a live inbox connected yet, so nothing left your browser. Your text is still in the form — copy it and send it through a channel you already use with us.",
  },
};

export const notFound = {
  title: "Lost past the horizon.",
  body: "The page you are looking for does not exist, or it has moved.",
  cta: { label: "Back to home", href: routes.home },
};
