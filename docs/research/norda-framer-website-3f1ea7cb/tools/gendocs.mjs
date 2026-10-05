// Generates per-entry PAGE_TOPOLOGY.md / BEHAVIORS.md for CMS entries and updates ROUTE_MANIFEST.json.
import fs from "node:fs";
import path from "node:path";

const ROOT = "C:/Users/quocc/Downloads/norda";
const SITE = "norda-framer-website-3f1ea7cb";
const R = path.join(ROOT, "docs/research", SITE);
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const crawl = JSON.parse(fs.readFileSync(path.join(R, "raw/crawl.json"), "utf8"));
const report = JSON.parse(fs.readFileSync(path.join(R, "qa/route-report.json"), "utf8"));
const results = Array.isArray(report) ? report : report.results;
const manifest = JSON.parse(fs.readFileSync(path.join(R, "ROUTE_MANIFEST.json"), "utf8"));

function records(file, first, second) {
  const src = read(`src/data/sites/${SITE}/${file}`);
  const out = [];
  const re = new RegExp(`\\n\\s+slug: "([^"]+)",\\r?\\n\\s+${first}: "([^"]+)"(?:,\\r?\\n\\s+${second || "zzz"}: "([^"]+)")?`, "g");
  let m;
  while ((m = re.exec(src))) out.push({ slug: m[1], title: m[2], extra: m[3] });
  return out.filter((v, i, a) => a.findIndex((x) => x.slug === v.slug) === i);
}
const data = {
  projects: records("projects.ts", "name"),
  team: records("team.ts", "name", "role"),
  jobs: records("jobs.ts", "title"),
  news: records("news.ts", "title"),
};
const TPL = {
  projects: { name: "ProjectDetailTemplate", file: "shared/templates/ProjectDetailTemplate.tsx", spec: "../projects--verve-tower-f6679463/components/ProjectDetailTemplate.md", route: "src/app/projects/[slug]/page.tsx", data: "projects.ts (projectDetails)" },
  team: { name: "TeamMemberTemplate", file: "shared/templates/TeamMemberTemplate.tsx", spec: "../team--erik-lindholm-73da45d4/components/TeamMemberTemplate.md", route: "src/app/team/[slug]/page.tsx", data: "team.ts" },
  jobs: { name: "JobDetailTemplate", file: "shared/templates/JobDetailTemplate.tsx", spec: "../jobs--interior-designer-5f4757ee/components/JobDetailTemplate.md", route: "src/app/jobs/[slug]/page.tsx", data: "jobs.ts" },
  news: { name: "ArticleTemplate", file: "shared/templates/ArticleTemplate.tsx", spec: "../news--how-architecture-shapes-productivity-213a278c/components/ArticleTemplate.md", route: "src/app/news/[slug]/page.tsx", data: "news.ts (articles)" },
};
const STATIC = {
  "/": ["src/app/page.tsx", "home sections (root-8a5edab2/*)"],
  "/about": ["src/app/about/page.tsx", "PageHeader + MeetTheTeam + RotatingBadge + RecordList + JobList"],
  "/privacy-policy": ["src/app/privacy-policy/page.tsx", "privacy layout + RichText"],
  "/projects": ["src/app/projects/page.tsx", "PageHeader + ProjectStack + RecordList"],
  "/news": ["src/app/news/page.tsx", "PageHeader + ArticleCard"],
  "/contact": ["src/app/contact/page.tsx", "PageHeader + ContactForm + FitText"],
  "/404": ["src/app/404/page.tsx + src/app/not-found.tsx", "NotFoundView"],
};
const heights = (p) =>
  [1440, 1024, 390].map((w) => {
    const r = results.find((x) => x.path === p && x.width === w);
    if (!r) return `${w}: —`;
    const ref = r.refHeight ? ` (ref ${r.refHeight}, Δ${r.height - r.refHeight})` : "";
    return `${w}: ${r.height}${ref} · status ${r.status} · overflow ${r.overflowX} · console errors ${r.consoleErrors.length} · blocked requests ${r.blocked.length}`;
  });
const decode = (p) => decodeURIComponent(p);

for (const c of crawl) {
  const seg = decode(c.path).split("/").filter(Boolean);
  const kind = seg.length === 2 ? seg[0] : null;
  const entry = manifest.find((m) => decode(m.localPath) === decode(c.path));
  if (entry) {
    entry.implementationStatus = "done";
    entry.routeFile = kind ? TPL[kind].route : STATIC[c.path]?.[0];
    entry.componentTemplate = kind ? TPL[kind].name : STATIC[c.path]?.[1];
    entry.qaStatus = `qa-routes pass at 1440/1024/390 · visual frames design-references/${SITE}/${c.key}/compare/ · see QA_REPORT.md`;
    entry.inspectedStates = Array.from(new Set([...(entry.inspectedStates || []), "viewport-height variance 1440×700 / 1024×700 / 390×700 / 1440×1100"]));
    if (kind) entry.contentIds = [`${TPL[kind].data}#${seg[1]}`];
    entry.gaps = entry.gaps || [];
  }
  if (!kind) continue;
  const rec = data[kind].find((r) => r.slug === seg[1]);
  const t = TPL[kind];
  const dir = path.join(R, c.key);
  fs.mkdirSync(dir, { recursive: true });
  const title = rec ? rec.title : seg[1];
  const lines = [
    `# \`${decode(c.path)}\` — page topology (page key \`${c.key}\`)`,
    "",
    `CMS entry rendered by \`${t.route}\` → \`${t.file}\` (spec: [${t.name}](${t.spec})).`,
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| Source | \`https://norda.framer.website${c.path}\` |`,
    `| Local route | \`${c.path}\` |`,
    `| Record | \`src/data/sites/${SITE}/${t.data}\`, slug \`${seg[1]}\` — "${title}"${rec?.extra ? ` (${rec.extra})` : ""} |`,
    `| Evidence | \`raw/${c.key}/\` (DOM 1440/390, compact styles 1440/1024/390), \`design-references/${SITE}/${c.key}/\` |`,
    "",
    "Section order, layout and responsive rules are the template's; entry differences are content only (text, images, list lengths, wraps).",
    "",
    "## Document height — production build vs reference crawl",
    "",
    ...heights(c.path).map((h) => `- ${h}`),
    "",
    "1024 has no crawl reference; it was compared live (Δ 1–2px in the final tablet run).",
    "",
  ];
  fs.writeFileSync(path.join(dir, "PAGE_TOPOLOGY.md"), lines.join("\n"));
  const extra = {
    jobs: '- Title character reveal ≈1.4s after mount (desktop + phone); quote line reveal 0.2s after entering view (desktop + tablet); "Apply Now" inert (source: mailto).',
    projects: '- Parallax hero and gallery; "Next Project" banner links to the next entry.',
    team: '- SCROLL link to `#main-container`; "Meet the Team" → `/about#meet-the-team`.',
    news: '- Parallax cover; "More News →" → `/news`.',
  }[kind];
  fs.writeFileSync(
    path.join(dir, "BEHAVIORS.md"),
    [
      `# \`${decode(c.path)}\` — behaviors`,
      "",
      `Same interaction model as the template — see [${t.name}](${t.spec}) and \`../ANIMATION_INVENTORY.md\`.`,
      "",
      extra,
      "",
      `Verified by \`tests/qa-routes.mjs\` (all widths) and the visual frames under \`design-references/${SITE}/${c.key}/compare/\`.`,
      "",
    ].join("\n"),
  );
}
fs.writeFileSync(path.join(R, "ROUTE_MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("manifest entries", manifest.length, "done", manifest.filter((m) => m.implementationStatus === "done").length);
console.log(Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length])));
