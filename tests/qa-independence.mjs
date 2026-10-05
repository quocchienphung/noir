#!/usr/bin/env node
// Static brand + independence checks for NOIR. Run after `npm run build` so .next/ output is scanned too.
// Usage: node tests/qa-independence.mjs
// 1. Runtime source (src/), served files (public/) and build output (.next/server, .next/static) contain no
//    old-brand strings and no references to reference/upstream hosts (Eventide, YouTube, Framer, font CDNs,
//    analytics). Provenance and research files (docs/, scripts/, prompt/) are excluded on purpose.
// 2. No <iframe>/<video> embeds of third-party media in source.
// 3. No reference screenshot (docs/design-references) is served from public/.
// 4. Every file under public/sites/noir/ is listed in docs/research/noir/MEDIA_PROVENANCE.md.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const HOSTS = [
  /eventide\.framer\.ai/i,
  /youtube\.com|youtu\.be|ytimg\.com|googlevideo\.com/i,
  /framerusercontent\.com|framer\.website|framer\.app|framerstatic\.com/i,
  /fonts\.gstatic\.com|fonts\.googleapis\.com/i,
  /googletagmanager\.com|google-analytics\.com/i,
];
const OLD_BRAND = [/nord[åa]/i, /NORDÅ/, /norda-framer-website/i, /crafting spaces/i, /\barchitects\b/i, /WaveMark/];
const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".mjs", ".css", ".json", ".html", ".svg", ".txt", ".rsc", ".webmanifest", ".body", ".meta"]);
const failures = [];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["cache", "node_modules", "dev", "types"].includes(e.name)) continue;
      walk(p, out);
    } else out.push(p);
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p).replaceAll("\\", "/");

const scanned = [...walk(path.join(ROOT, "src")), ...walk(path.join(ROOT, "public")), ...walk(path.join(ROOT, ".next/server")), ...walk(path.join(ROOT, ".next/static"))].filter((f) =>
  TEXT_EXT.has(path.extname(f)),
);
for (const f of scanned) {
  const text = fs.readFileSync(f, "utf8");
  for (const re of [...HOSTS, ...OLD_BRAND]) {
    const m = text.match(re);
    if (m) failures.push(`${rel(f)}: matches ${re} ("${m[0]}")`);
  }
}

for (const f of walk(path.join(ROOT, "src")).filter((f) => /\.(tsx|ts)$/.test(f))) {
  const text = fs.readFileSync(f, "utf8");
  if (/<iframe\b/i.test(text)) failures.push(`${rel(f)}: contains an iframe`);
  if (/<video\b/i.test(text)) failures.push(`${rel(f)}: contains a video element (no licensed footage is used)`);
}

const hash = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const refHashes = new Set(walk(path.join(ROOT, "docs/design-references")).map(hash));
// empty template placeholders (.gitkeep) are neither media nor served content
const publicFiles = walk(path.join(ROOT, "public")).filter((f) => fs.statSync(f).size > 0);
for (const f of publicFiles) if (refHashes.has(hash(f))) failures.push(`${rel(f)}: identical to a reference capture in docs/design-references`);

const provenance = fs.readFileSync(path.join(ROOT, "docs/research/noir/MEDIA_PROVENANCE.md"), "utf8");
for (const f of walk(path.join(ROOT, "public/sites/noir"))) {
  const p = rel(f).replace(/^public/, "");
  if (!provenance.includes(p)) failures.push(`${p}: not listed in MEDIA_PROVENANCE.md`);
}
const strays = publicFiles.filter((f) => !rel(f).startsWith("public/sites/noir/"));
strays.forEach((f) => failures.push(`${rel(f)}: served file outside public/sites/noir`));

console.log(`scanned ${scanned.length} text files, ${publicFiles.length} public files`);
if (failures.length) {
  console.log(`FAIL (${failures.length})\n` + failures.slice(0, 60).join("\n"));
  process.exit(1);
}
console.log("PASS");
