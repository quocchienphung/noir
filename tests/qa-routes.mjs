#!/usr/bin/env node
// Route QA for NOIR.
// Usage: node tests/qa-routes.mjs [baseUrl=http://localhost:3200] [widths=1440,1280,768,390,320]
// Per route × width (fresh context, off-origin requests aborted and recorded): HTTP status, console/page
// errors, failed same-origin requests (missing assets), horizontal overflow, NOIR title, no old-brand text,
// no transparent-but-focusable controls. Then: every internal link resolves, retired routes redirect.
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:3200";
const widths = (process.argv[3] || "1440,1280,768,390,320").split(",").map(Number);
const origin = new URL(base).origin;

const routes = [
  { path: "/", expect: 200 },
  { path: "/projects", expect: 200 },
  { path: "/about", expect: 200 },
  { path: "/contact", expect: 200 },
  { path: "/privacy-policy", expect: 200 },
  { path: "/404", expect: 404 },
  { path: "/this-route-does-not-exist", expect: 404 },
];
const redirects = [
  ["/projects/verve-tower", "/projects"],
  ["/team/erik-lindholm", "/about"],
  ["/jobs/interior-designer", "/contact"],
  ["/news", "/"],
  ["/news/how-architecture-shapes-productivity", "/"],
];
// "Architect"/"architecture" are legitimate in NOIR's software sense (process step, services), so only the
// old brand and the architecture-firm vocabulary are flagged.
const OLD_BRAND = /nord[åa]|\barchitects\b|interior design|urban spaces|crafting spaces/i;

const browser = await chromium.launch({ channel: "chrome" });
const failures = [];
const links = new Set();
const fail = (msg) => failures.push(msg);

for (const route of routes) {
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 }, serviceWorkers: "block" });
    const tag = `${route.path} @${w}`;
    await ctx.route("**/*", (r) => {
      const u = new URL(r.request().url());
      if (u.origin === origin || u.protocol === "data:" || u.protocol === "blob:") return r.continue();
      fail(`${tag}: off-origin request ${u.href}`);
      return r.abort();
    });
    const page = await ctx.newPage();
    page.on("console", (m) => {
      if (m.type() === "error" && !(route.expect === 404 && m.text().includes("status of 404"))) fail(`${tag}: console ${m.text().slice(0, 200)}`);
    });
    page.on("pageerror", (e) => fail(`${tag}: pageerror ${String(e).slice(0, 200)}`));
    page.on("response", (r) => {
      const doc = r.request().resourceType() === "document";
      if (new URL(r.url()).origin === origin && r.status() >= 400 && !(doc && route.expect === 404)) fail(`${tag}: ${r.status()} ${r.url()}`);
    });
    const res = await page.goto(base + route.path, { waitUntil: "load" });
    if (res?.status() !== route.expect) fail(`${tag}: status ${res?.status()} (expected ${route.expect})`);
    // walk the page so lazy images and scroll-driven sections run
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < h; y += 700) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(400);
    // the sitewide entrance (components/noir/motion) may still be running on short pages: the ghost-focus check is
    // about the settled page, so wait until no motion target is mid-animation (bounded)
    await page.waitForFunction(() => document.getAnimations().every((a) => !(a.effect?.target instanceof Element && a.effect.target.closest("[data-m], [data-route-surface]")) || a.playState !== "running"), null, { timeout: 4000 }).catch(() => {});
    const info = await page.evaluate((re) => {
      const brand = new RegExp(re, "i");
      const text = document.body.innerText + " " + [...document.querySelectorAll("[alt],[aria-label],[title]")].map((e) => `${e.getAttribute("alt") ?? ""} ${e.getAttribute("aria-label") ?? ""} ${e.getAttribute("title") ?? ""}`).join(" ");
      const ghostFocusable = [...document.querySelectorAll("a[href],button,input,select,textarea,[tabindex]:not([tabindex='-1'])")].filter((el) => {
        if (el.closest("[inert]")) return false;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") return false;
        let n = el;
        while (n && n !== document.body) {
          if (parseFloat(getComputedStyle(n).opacity) < 0.05) return true;
          n = n.parentElement;
        }
        return false;
      }).map((el) => el.outerHTML.slice(0, 80));
      const imgs = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).map((i) => i.currentSrc);
      return {
        title: document.title,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        oldBrand: (text.match(brand) || [])[0] ?? null,
        ghostFocusable,
        brokenImages: imgs,
        links: [...document.querySelectorAll("a[href^='/']")].map((a) => a.getAttribute("href")),
      };
    }, OLD_BRAND.source);
    if (!/NOIR/.test(info.title)) fail(`${tag}: title "${info.title}" lacks NOIR`);
    if (info.overflow > 0) fail(`${tag}: horizontal overflow ${info.overflow}px`);
    if (info.oldBrand) fail(`${tag}: old brand text "${info.oldBrand}"`);
    if (info.ghostFocusable.length) fail(`${tag}: focusable but transparent: ${info.ghostFocusable.join(", ")}`);
    if (info.brokenImages.length) fail(`${tag}: broken images ${info.brokenImages.join(", ")}`);
    info.links.forEach((l) => links.add(l.split("#")[0]));
    await ctx.close();
  }
}

// internal links
for (const href of links) {
  const r = await fetch(base + href, { redirect: "manual" });
  if (r.status >= 400) fail(`link ${href}: ${r.status}`);
}
// retired routes
for (const [from, to] of redirects) {
  const r = await fetch(base + from, { redirect: "manual" });
  const loc = r.headers.get("location");
  if (![307, 308].includes(r.status) || new URL(loc ?? "", base).pathname !== to) fail(`redirect ${from}: ${r.status} → ${loc} (expected ${to})`);
}

await browser.close();
console.log(`routes: ${routes.length} × ${widths.length} widths, ${links.size} internal links, ${redirects.length} redirects`);
if (failures.length) {
  console.log(`FAIL (${failures.length})\n` + failures.join("\n"));
  process.exit(1);
}
console.log("PASS");
