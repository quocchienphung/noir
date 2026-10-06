// Cards Almanac: the project cards after the intro (replaces the retired wormhole/tesseract archive).
// THE ONE PLACE TO ADD PROJECTS AND DEMOS — see docs/research/cards-almanac/implementation/DEMO_AUTHORING.md.
//
// Editorial content only. Stack geometry and motion (src/lib/noir/cards-almanac/stack.ts) never read anything
// here except the number of cards; adding a card or a demo never requires touching transforms.
//
// Honesty rules (carried over from the archive): no client, screenshot, date or demo is invented. A slot is
// "empty" until its author adds real content; "template" shows real NOIR copy (not a client demo); "live"
// requires a real URL. Covers are genuine images of the project they sit on, with provenance, or null (a
// code-generated colour field labelled as a placeholder is drawn instead).

import { contact, routes, work } from "./site";

interface SlotBase {
  /** Stable, unique inside its card. */
  id: string;
  /** Section label shown in the details dialog. */
  label: string;
  /** Optional fragment or path appended to a live URL (e.g. "#pricing"). */
  sectionAnchor: string | null;
}

/** Nothing added yet. */
export interface EmptySlot extends SlotBase {
  readiness: "empty";
  liveUrl: null;
  previewAsset: null;
  emptyMessage: string;
}

/** Real NOIR copy (not a client demo, and labelled as a template). */
export interface TemplateSlot extends SlotBase {
  readiness: "template";
  liveUrl: null;
  /** Optional image of the demo website itself (provenance required). */
  previewAsset: string | null;
  body: string;
  /** Optional real internal link for this content. */
  link: { label: string; href: string } | null;
}

/** A real, author-supplied demo URL. Embedded only on request, one at a time; always also offered as a link. */
export interface LiveSlot extends SlotBase {
  readiness: "live";
  liveUrl: string;
  previewAsset: string | null;
  /** Shown before loading and next to the "Open in a new tab" fallback. */
  description: string;
  /** Whether the target permits framing (X-Frame-Options / CSP frame-ancestors). false → link only. */
  embeddable: boolean;
  /**
   * iframe sandbox tokens chosen for this demo's real needs. Default (null): scripts, forms and popups, but not
   * same-origin — unknown third-party code is never treated as trusted.
   */
  sandbox: string | null;
}

export type DemoSectionSlot = EmptySlot | TemplateSlot | LiveSlot;
export type DemoReadiness = DemoSectionSlot["readiness"];

/** A genuine image of the project (never reference art, never a stock or film still). */
export interface CardCover {
  /** Path under /public. */
  src: string;
  alt: string;
  width: number;
  height: number;
  /** "cover" crops into the near-square frame; "contain" letterboxes (use for screenshots that must not be cropped). */
  fit: "cover" | "contain";
  /** CSS object-position for the crop. */
  position: string;
  /** Where the image comes from (also recorded in MEDIA_PROVENANCE). */
  provenance: string;
}

export interface AlmanacCard {
  /** Stable, unique; also the card's anchor (`#card-<id>`). */
  id: string;
  /** "experiment": a public NOIR experiment; "reserved": an open slot; "fixture": dev-only test card. */
  kind: "experiment" | "reserved" | "fixture";
  title: string;
  /** Small grey metadata line at the top of the copy column. */
  meta: string;
  /** Genuine year from the source, or null — never invented. */
  year: string | null;
  /** Small pill at the bottom of the copy column. */
  category: string;
  description: string;
  cover: CardCover | null;
  /** Placeholder colour field when there is no cover: label + base hue (degrees). */
  placeholder: { label: string; hue: number };
  /** Real internal link for the project, or null. Not a live demo. */
  link: { label: string; href: string } | null;
  stack: readonly string[];
  /** Ordered demo sections shown in the details dialog. */
  sections: readonly DemoSectionSlot[];
  /** `work.experiments[].id` this card mirrors, if any. */
  sourceExperimentId: string | null;
}

const empty = (id: string, label: string, message: string): EmptySlot => ({
  id,
  label,
  readiness: "empty",
  liveUrl: null,
  previewAsset: null,
  sectionAnchor: null,
  emptyMessage: message,
});

const experiment = (id: string) => {
  const e = work.experiments.find((x) => x.id === id);
  if (!e) throw new Error(`cards-almanac: unknown experiment ${id}`);
  return e;
};

/** The four demo sections of a public experiment: real copy as templates; no live URL yet (migrated from the
 *  archive's Present snapshot; its Past/Future snapshots held no authored content). */
function experimentSections(id: string): DemoSectionSlot[] {
  const e = experiment(id);
  return [
    { id: "landing", label: "Landing", readiness: "template", liveUrl: null, previewAsset: null, sectionAnchor: null, body: e.body, link: { label: e.cta, href: e.href } },
    { id: "featured", label: "Featured work", readiness: "template", liveUrl: null, previewAsset: null, sectionAnchor: null, body: `${e.kind}. Built with ${e.stack.join(", ")}.`, link: null },
    empty("details", "Details & process", "Section slot — not added yet."),
    { id: "contact", label: "Contact", readiness: "template", liveUrl: null, previewAsset: null, sectionAnchor: null, body: "Questions about this experiment, or a project like it?", link: { label: "Start a project", href: routes.contact } },
  ];
}

function experimentCard(id: string, cover: CardCover | null, hue: number): AlmanacCard {
  const e = experiment(id);
  return {
    id,
    kind: "experiment",
    title: e.title,
    meta: `${e.kind} · ${e.year}`,
    year: e.year,
    category: e.stack[0],
    description: e.body,
    cover,
    placeholder: { label: "Preview coming soon", hue },
    link: { label: e.cta, href: e.href },
    stack: e.stack,
    sections: experimentSections(id),
    sourceExperimentId: id,
  };
}

/**
 * Open demo slots, one per kind of project NOIR takes on (`contact.projectTypes`). Each is clearly reserved:
 * no client, cover, date or URL — the four sections are empty until a real project is added.
 */
function reservedCard(id: string, type: string, hue: number): AlmanacCard {
  if (!contact.projectTypes.includes(type)) throw new Error(`cards-almanac: unknown project type ${type}`);
  const message = "Demo slot — ready for your project.";
  return {
    id,
    kind: "reserved",
    title: `Open slot · ${type}`,
    meta: "Reserved",
    year: null,
    category: type,
    description: `Reserved for a future ${type.toLowerCase()} project. Nothing here is a client project yet — the slot is ready for a cover, its sections and a live demo.`,
    cover: null,
    placeholder: { label: "Demo slot available", hue },
    link: null,
    stack: [],
    sections: [
      empty("landing", "Landing", message),
      empty("featured", "Featured work", message),
      empty("details", "Details & process", message),
      empty("contact", "Contact", message),
    ],
    sourceExperimentId: null,
  };
}

/** [stable id, project type, placeholder hue] — the first keeps the archive's `open-slot` id. */
const RESERVED: readonly (readonly [string, string, number])[] = [
  ["open-slot", "Website", 330],
  ["open-slot-web-app", "Web application", 150],
  ["open-slot-cloud", "Cloud & infrastructure", 205],
  ["open-slot-automation", "Integrations & automation", 42],
];

export const cardsAlmanac = {
  /** Accessible name of the card list. */
  listLabel: "NOIR experiments and demo slots",
  note: "Experiments are NOIR's own work, not client projects. Open slots have no content yet.",
  cards: [
    experimentCard(
      "event-horizon-renderer",
      {
        src: "/sites/noir/media/cinematic-poster.jpg",
        alt: "A black hole rendered by the NOIR event-horizon renderer: a lensed accretion disk wrapped around a dark shadow.",
        width: 1920,
        height: 1200,
        fit: "cover",
        position: "50% 50%",
        provenance: "Frame rendered by this site's own WebGL2 renderer (the cinematic section's poster).",
      },
      28,
    ),
    experimentCard(
      "this-site",
      {
        src: "/sites/noir/media/covers/this-site-home.jpg",
        alt: "The NOIR home page: the headline “Digital experiences.” over the ray-traced black hole.",
        width: 1080,
        height: 1080,
        fit: "cover",
        position: "50% 50%",
        provenance: "Screenshot of this website's home page (1080×1080 CSS px, 2026-10-06).",
      },
      210,
    ),
    ...RESERVED.map(([id, type, hue]) => reservedCard(id, type, hue)),
  ] satisfies readonly AlmanacCard[] as readonly AlmanacCard[],
};
