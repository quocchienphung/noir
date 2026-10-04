#!/usr/bin/env node
// Route + runtime-independence QA for the Nordå reconstruction.
// Usage: node tests/qa-routes.mjs [baseUrl=http://localhost:3200] [widths=1440,1024,390]
// For every route it opens a fresh browser context (service workers blocked), aborts every request that is
// not to the local origin (recording it), loads the page, scrolls to trigger lazy media, and checks:
// HTTP status, console errors / page errors, failed same-origin requests, broken images / video,
// horizontal overflow, and document height (compared with the reference crawl when available).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const SITE = "norda-framer-website-3f1ea7cb";
const base = process.argv[2] || "http://localhost:3200";
const widths = (process.argv[3] || "1440,1024,390").split(",").map(Number);
const origin = new URL(base).origin;

const crawl = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/research", SITE, "raw/crawl.json"), "utf8"));
const routes = [...crawl.map((c) => ({ path: c.path, expect: c.path === "/404" ? 404 : 200, ref: c })), { path: "/this-route-does-not-exist", expect: 404 }, { path: "/projects/unknown-slug", expect: 404 }];

const browser = await chromium.launch({ channel: "chrome" });
const results = [];

for (const route of routes) {
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 }, serviceWorkers: "block" });
    const blocked = [];
    const failed = [];
    const consoleErrors = [];
    await ctx.route("**/*", (r) => {
      const u = new URL(r.request().url());
      if (u.origin === origin || u.protocol === "data:" || u.protocol === "blob:") return r.continue();
      blocked.push(r.request().url());
      return r.abort();
    });
    const page = await ctx.newPage();
    page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 300)));
    page.on("pageerror", (e) => consoleErrors.push("pageerror: " + String(e).slice(0, 300)));
    page.on("requestfailed", (r) => {
      if (new URL(r.url()).origin === origin) failed.push(`${r.url()} ${r.failure()?.errorText}`);
    });
    page.on("response", (r) => {
      if (new URL(r.url()).origin === origin && r.status() >= 400 && r.url() !== page.url()) failed.push(`${r.status()} ${r.url()}`);
    });
    let status = 0;
    try {
      const resp = await page.goto(base + route.path, { waitUntil: "networkidle", timeout: 120000 });
      status = resp?.status() ?? 0;
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 400));
      });
      await page.waitForLoadState("networkidle");
      const info = await page.evaluate(() => {
        const imgs = [...document.querySelectorAll("img")];
        const broken = imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.currentSrc || i.src);
        const videos = [...document.querySelectorAll("video")].map((v) => ({ src: v.currentSrc, ready: v.readyState, err: v.error?.code ?? null }));
        const fonts = [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family} ${f.weight} ${f.style}`);
        return {
          title: document.title,
          height: document.documentElement.scrollHeight,
          overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          images: imgs.length,
          broken,
          videos,
          fonts: [...new Set(fonts)],
          h1: [...document.querySelectorAll("h1")].map((h) => h.textContent.trim()).slice(0, 2),
        };
      });
      const refHeight = route.ref ? (w === 1440 ? route.ref.height1440 : w === 390 ? route.ref.height390 : null) : null;
      results.push({ path: route.path, width: w, status, expect: route.expect, refHeight, ...info, blocked, failed, consoleErrors });
    } catch (e) {
      results.push({ path: route.path, width: w, status, expect: route.expect, error: String(e).slice(0, 300), blocked, failed, consoleErrors });
    }
    await ctx.close();
  }
}
await browser.close();

const outDir = path.join(ROOT, "docs/research", SITE, "qa");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "route-report.json"), JSON.stringify({ base, date: new Date().toISOString(), results }, null, 2));

let problems = 0;
for (const r of results) {
  const issues = [];
  if (r.error) issues.push("ERROR " + r.error);
  if (r.status !== r.expect) issues.push(`status ${r.status} != ${r.expect}`);
  if (r.blocked.length) issues.push(`external requests: ${r.blocked.length} (${r.blocked.slice(0, 2).join(", ")})`);
  if (r.failed.length) issues.push(`failed: ${r.failed.slice(0, 3).join(", ")}`);
  if (r.consoleErrors.length) issues.push(`console: ${r.consoleErrors.slice(0, 2).join(" | ")}`);
  if (r.broken?.length) issues.push(`broken images: ${r.broken.length}`);
  if (r.videos?.some((v) => v.err)) issues.push("video error");
  if (r.overflowX > 0) issues.push(`horizontal overflow ${r.overflowX}px`);
  const drift = r.refHeight ? r.height - r.refHeight : null;
  if (issues.length) problems++;
  console.log(`${issues.length ? "✗" : "✓"} ${r.path} @${r.width} status ${r.status} h${r.height ?? "-"}${drift !== null ? ` (ref ${r.refHeight}, Δ${drift})` : ""}${issues.length ? "\n    " + issues.join("\n    ") : ""}`);
}
console.log(`\n${results.length} checks, ${problems} with issues. Report: docs/research/${SITE}/qa/route-report.json`);
process.exitCode = problems ? 1 : 0;
