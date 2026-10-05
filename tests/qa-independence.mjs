#!/usr/bin/env node
// Static upstream-independence checks for the Nordå reconstruction (complements the request blocking in
// tests/qa-routes.mjs and tests/qa-behaviors.mjs).
// Usage: node tests/qa-independence.mjs   (run after `npm run build` so .next/ output is scanned too)
// 1. Scans runtime source (src/), served files (public/) and build output (.next/server, .next/static)
//    for upstream hosts, analytics and remote font CDNs. Provenance files (docs/, scripts/) are excluded.
// 2. Checks prerendered HTML for canonical/og:url/refresh/form targets pointing off-site.
// 3. Verifies that no reference screenshot (docs/design-references) is served from public/ or imported.
// 4. Verifies every file under public/sites/<site>/ is an original-media entry in ASSET_MANIFEST.json
//    (same path and sha256) and that every manifest entry exists on disk.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const SITE = "norda-framer-website-3f1ea7cb";
const UPSTREAM = [
  /framerusercontent\.com/i,
  /norda\.framer\.website/i,
  /framer\.website/i,
  /framer\.com/i,
  /framer\.app/i,
  /framerstatic\.com/i,
  /events\.framer/i,
  /fonts\.gstatic\.com/i,
  /fonts\.googleapis\.com/i,
  /googletagmanager\.com/i,
  /google-analytics\.com/i,
];
const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".css", ".json", ".html", ".svg", ".txt", ".rsc", ".webmanifest", ".map", ".body", ".meta"]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "cache" || e.name === "node_modules") continue;
      walk(p, out);
    } else out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

// 1. Upstream references in runtime code / served files / build output.
const scanRoots = ["src", "public", ".next/server", ".next/static"].map((d) => path.join(ROOT, d));
const hits = [];
let scanned = 0;
for (const root of scanRoots) {
  for (const file of walk(root)) {
    if (!TEXT_EXT.has(path.extname(file).toLowerCase())) continue;
    scanned++;
    const text = fs.readFileSync(file, "utf8");
    for (const re of UPSTREAM) {
      const m = text.match(new RegExp(`.{0,60}${re.source}.{0,60}`, "i"));
      if (m) hits.push({ file: rel(file), pattern: re.source, context: m[0].replace(/\s+/g, " ") });
    }
  }
}

// 2. Prerendered HTML metadata / form targets.
const htmlIssues = [];
for (const file of walk(path.join(ROOT, ".next/server/app"))) {
  if (!file.endsWith(".html")) continue;
  const html = fs.readFileSync(file, "utf8");
  for (const [label, re] of [
    ["canonical", /<link[^>]+rel="canonical"[^>]*>/gi],
    ["og:url", /<meta[^>]+property="og:url"[^>]*>/gi],
    ["refresh", /<meta[^>]+http-equiv="refresh"[^>]*>/gi],
    ["form action", /<form[^>]+action="[^"]*"[^>]*>/gi],
    ["external href", /<a[^>]+href="(https?:)?\/\/[^"]*"[^>]*>/gi],
  ]) {
    for (const m of html.match(re) ?? []) {
      const offsite = /https?:\/\/(?!localhost)/i.test(m) || /href="\/\//i.test(m);
      if (label === "form action" || offsite) htmlIssues.push({ file: rel(file), label, tag: m.slice(0, 200) });
    }
  }
}

// 3. Reference screenshots must not be served or imported.
// Empty placeholder files (.gitkeep) are ignored — they hash identically everywhere.
const refShots = walk(path.join(ROOT, "docs/design-references")).filter((f) => fs.statSync(f).size > 0);
const refHashes = new Map(refShots.map((f) => [sha(f), rel(f)]));
const publicFiles = walk(path.join(ROOT, "public")).filter((f) => fs.statSync(f).size > 0);
const leakedScreens = publicFiles.filter((f) => refHashes.has(sha(f))).map((f) => ({ file: rel(f), sameAs: refHashes.get(sha(f)) }));
const importsOfRefs = walk(path.join(ROOT, "src")).filter((f) => /design-references/.test(fs.readFileSync(f, "utf8"))).map(rel);

// 4. Served site media ⇔ original-media manifest.
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/research", SITE, "ASSET_MANIFEST.json"), "utf8"));
const entries = Array.isArray(manifest) ? manifest : manifest.assets ?? [];
const byPath = new Map(entries.map((e) => [e.localPath, e]));
const siteFiles = walk(path.join(ROOT, "public/sites", SITE));
const unlisted = [];
const hashMismatch = [];
for (const f of siteFiles) {
  const local = "/" + rel(f).replace(/^public\//, "");
  const e = byPath.get(local);
  if (!e) unlisted.push(local);
  else if (e.sha256 && e.sha256 !== sha(f)) hashMismatch.push(local);
}
const missingOnDisk = entries.filter((e) => e.status === "ok" && !fs.existsSync(path.join(ROOT, "public", e.localPath))).map((e) => e.localPath);

const report = {
  generatedAt: new Date().toISOString(),
  buildOutputScanned: fs.existsSync(path.join(ROOT, ".next/server")),
  filesScanned: scanned,
  upstreamReferences: hits,
  prerenderedHtmlIssues: htmlIssues,
  referenceScreenshots: { count: refShots.length, servedFromPublic: leakedScreens, referencedFromSrc: importsOfRefs },
  assets: { manifestEntries: entries.length, servedFiles: siteFiles.length, unlisted, hashMismatch, missingOnDisk },
};
const out = path.join(ROOT, "docs/research", SITE, "qa/independence-report.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2));

console.log(`scanned ${scanned} files (build output ${report.buildOutputScanned ? "included" : "MISSING — run npm run build"})`);
console.log(`upstream references: ${hits.length}`);
for (const h of hits.slice(0, 40)) console.log(`  ${h.file} [${h.pattern}] … ${h.context}`);
console.log(`prerendered HTML issues: ${htmlIssues.length}`);
for (const h of htmlIssues.slice(0, 20)) console.log(`  ${h.file} ${h.label}: ${h.tag}`);
console.log(`reference screenshots: ${refShots.length} · served from public/: ${leakedScreens.length} · referenced from src/: ${importsOfRefs.length}`);
console.log(`site media: ${siteFiles.length} served files · ${entries.length} manifest entries · unlisted ${unlisted.length} · hash mismatch ${hashMismatch.length} · missing ${missingOnDisk.length}`);
if (hits.length || htmlIssues.length || leakedScreens.length || importsOfRefs.length || unlisted.length || hashMismatch.length || missingOnDisk.length || !report.buildOutputScanned) process.exitCode = 1;
