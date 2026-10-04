#!/usr/bin/env node
// Asset acquisition for the Nordå reconstruction (site key norda-framer-website-3f1ea7cb).
// Reads the rendered DOM captures in docs/research/<site>/raw/<page-key>/dom-*.html,
// downloads every original media file once (bounded concurrency, retries), validates the
// file signature, records provenance and writes ASSET_MANIFEST.json.
// Source URLs live only here and in the research manifest — never in runtime code.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const SITE = "norda-framer-website-3f1ea7cb";
const RAW = path.join(ROOT, "docs/research", SITE, "raw");
const PUBLIC_BASE = path.join(ROOT, "public/sites", SITE);
const CONCURRENCY = 4;

const FONTS = [
  { url: "https://fonts.gstatic.com/s/albertsans/v3/i7dOIFdwYjGaAMFtZd_QA2ZZalayGhyV.woff2", name: "albert-sans-variable-400.woff2", family: "Albert Sans Variable", weight: "400 (variable axis file)", style: "normal" },
  { url: "https://fonts.gstatic.com/s/albertsans/v3/i7dZIFdwYjGaAMFtZd_QA3xXSKZqhr-TenSHmZP_qY32TxAj1g.woff2", name: "albert-sans-500.woff2", family: "Albert Sans", weight: "500", style: "normal" },
  { url: "https://fonts.gstatic.com/s/albertsans/v3/i7dZIFdwYjGaAMFtZd_QA3xXSKZqhr-TenSHTJT_qY32TxAj1g.woff2", name: "albert-sans-700.woff2", family: "Albert Sans", weight: "700", style: "normal" },
  { url: "https://fonts.gstatic.com/s/albertsans/v3/i7dfIFdwYjGaAMFtZd_QA1Zeelmy79QJ1HOSY9Al74f3bRUz1r5t.woff2", name: "albert-sans-500-italic.woff2", family: "Albert Sans", weight: "500", style: "italic" },
  { url: "https://fonts.gstatic.com/s/albertsans/v3/i7dfIFdwYjGaAMFtZd_QA1Zeelmy79QJ1HOSY9Dw6If3bRUz1r5t.woff2", name: "albert-sans-700-italic.woff2", family: "Albert Sans", weight: "700", style: "italic" },
];

// Favicon, touch icon and social preview image declared in the reference <head>.
const SEO = [
  { url: "https://framerusercontent.com/images/ET8Ep6WnTrmBZychs3azYMT3fg.png", name: "favicon.png" },
  { url: "https://framerusercontent.com/images/sLc2Ad36zpp3xYkPnUmeAgvssI.png", name: "apple-touch-icon.png" },
  { url: "https://framerusercontent.com/images/PYvmJsaVccOlLpDvnjLqragV1e0.png", name: "og-image.png" },
];

// Promotional / template-marketplace media that is intentionally not part of the reconstruction.
const EXCLUDED = new Set(["zKYk3xaySEc43cUDiQTIdQsugwU.jpg"]);

const SIGNATURES = [
  { mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: "image/png", test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: "image/webp", test: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
  { mime: "image/svg+xml", test: (b) => /^\s*(<\?xml|<svg)/.test(b.subarray(0, 200).toString()) },
  { mime: "video/mp4", test: (b) => b.subarray(4, 8).toString() === "ftyp" },
  { mime: "font/woff2", test: (b) => b.subarray(0, 4).toString() === "wOF2" },
];

function sniff(buf) {
  return SIGNATURES.find((s) => s.test(buf))?.mime ?? null;
}

async function fetchWithRetry(url, attempts = 4) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { redirect: "follow" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length === 0) throw new Error("empty body");
      return { buf, contentType: res.headers.get("content-type") };
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 500 * 2 ** i));
    }
  }
  throw lastErr;
}

function collectUsage() {
  const usage = new Map(); // file -> { url, routes:Set, alts:Set }
  const crawl = JSON.parse(fs.readFileSync(path.join(RAW, "crawl.json"), "utf8"));
  for (const entry of crawl) {
    for (const f of ["dom-1440.html", "dom-390.html"]) {
      const p = path.join(RAW, entry.key, f);
      if (!fs.existsSync(p)) continue;
      const html = fs.readFileSync(p, "utf8");
      const re = /https:\/\/framerusercontent\.com\/(images|assets)\/([A-Za-z0-9_-]+\.(jpg|jpeg|png|svg|mp4|webp|gif))/g;
      let m;
      while ((m = re.exec(html))) {
        const file = m[2];
        if (EXCLUDED.has(file)) continue;
        if (!usage.has(file)) usage.set(file, { url: `https://framerusercontent.com/${m[1]}/${file}`, routes: new Set() });
        usage.get(file).routes.add(entry.path);
      }
    }
  }
  return usage;
}

async function pool(items, worker) {
  const results = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (i < items.length) {
        const idx = i++;
        results[idx] = await worker(items[idx]);
      }
    }),
  );
  return results;
}

function pageKeyFor(route, crawl) {
  return crawl.find((c) => c.path === route)?.key;
}

async function main() {
  const crawl = JSON.parse(fs.readFileSync(path.join(RAW, "crawl.json"), "utf8"));
  const usage = collectUsage();
  const jobs = [];
  for (const [file, u] of usage) {
    const routes = [...u.routes].sort();
    const ext = file.split(".").pop();
    const kindDir = ext === "mp4" ? "videos" : "images";
    const scope = routes.length === 1 ? pageKeyFor(routes[0], crawl) : "shared";
    jobs.push({ id: file.replace(/\.[^.]+$/, ""), kind: ext === "mp4" ? "video" : ext === "svg" ? "vector" : "image", url: u.url, rel: `${scope}/${kindDir}/${file}`, routes });
  }
  for (const s of SEO) jobs.push({ id: `seo-${s.name.replace(/\.png$/, "")}`, kind: "image", url: s.url, rel: `shared/seo/${s.name}`, routes: ["*"] });
  for (const f of FONTS) jobs.push({ id: f.name.replace(/\.woff2$/, ""), kind: "font", url: f.url, rel: `shared/fonts/${f.name}`, routes: ["*"], font: f });

  const byHash = new Map();
  const manifest = await pool(jobs, async (job) => {
    const dest = path.join(PUBLIC_BASE, job.rel);
    const entry = { id: job.id, kind: job.kind, sourceUrl: job.url, localPath: `/sites/${SITE}/${job.rel}`, usageRoutes: job.routes, status: "pending" };
    try {
      let buf;
      if (fs.existsSync(dest) && fs.statSync(dest).size > 0) buf = fs.readFileSync(dest);
      else {
        ({ buf } = await fetchWithRetry(job.url));
      }
      const mime = sniff(buf);
      if (!mime) throw new Error("unrecognised file signature (possible HTML error page)");
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
      entry.mimeType = mime;
      entry.bytes = buf.length;
      entry.sha256 = crypto.createHash("sha256").update(buf).digest("hex");
      if (mime.startsWith("image/")) {
        const meta = await sharp(buf).metadata();
        entry.intrinsicWidth = meta.width;
        entry.intrinsicHeight = meta.height;
      }
      if (job.font) entry.fontFamilyAndWeight = `${job.font.family} ${job.font.weight} ${job.font.style}`;
      if (byHash.has(entry.sha256)) entry.notes = `duplicate content of ${byHash.get(entry.sha256)}`;
      else byHash.set(entry.sha256, entry.id);
      entry.status = "ok";
    } catch (e) {
      entry.status = "failed";
      entry.notes = String(e.message || e);
    }
    process.stdout.write(`${entry.status.padEnd(6)} ${job.rel}\n`);
    return entry;
  });

  const out = path.join(ROOT, "docs/research", SITE, "ASSET_MANIFEST.raw.json");
  fs.writeFileSync(out, JSON.stringify(manifest, null, 2));
  const failed = manifest.filter((m) => m.status !== "ok");
  console.log(`\n${manifest.length} assets, ${failed.length} failed, ${(manifest.reduce((a, m) => a + (m.bytes || 0), 0) / 1e6).toFixed(1)} MB`);
  if (failed.length) process.exitCode = 1;
}

main();
