#!/usr/bin/env node
// Settled-layout fingerprint of every public route (sitewide motion task): the motion remaster must not change
// layout, copy, links or section order once animations have finished.
// Usage:
//   node tests/qa-motion-layout.mjs capture <name> [baseUrl=http://localhost:3000]
//   node tests/qa-motion-layout.mjs compare <before> <after>
// capture: for each route × viewport, scrolls the whole page (so viewport reveals run), waits for settle, returns
// to the top and records the document-space box, text and href of every structural element in <main> and the
// footer, the heading order and computed style residue (opacity/transform/filter) — plus settled screenshots.
// Output: docs/research/sitewide-motion/<name>/layout.json and *.png.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const OUTROOT = path.join(ROOT, "docs/research/sitewide-motion");
const [mode, a, b = "http://localhost:3000"] = process.argv.slice(2);

const ROUTES = ["/", "/projects", "/about", "/contact", "/privacy-policy", "/404", "/this-route-does-not-exist"];
const VIEWPORTS = [
  [1440, 900],
  [1280, 800],
  [1200, 900],
  [1199, 900],
  [810, 900],
  [809, 900],
  [390, 844],
  [320, 844],
];
const SHOT_VIEWPORTS = new Set(["1440x900", "390x844"]);

async function capture(name, base) {
  const OUT = path.join(OUTROOT, name);
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
  const result = {};
  for (const [w, h] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    for (const route of ROUTES) {
      await page.goto(`${base}${route}${route === "/" ? "?bhT=12&bhPtr=0" : ""}`, { waitUntil: "load" });
      await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(2600);
      // walk the page so viewport reveals fire, then settle
      const H = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y <= H; y += Math.round(h * 0.6)) {
        await page.evaluate((y) => window.scrollTo(0, y), y);
        await page.waitForTimeout(120);
      }
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(1600);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1200);
      const key = `${route} @${w}x${h}`;
      result[key] = await page.evaluate(() => {
        const sel = "main, main section, main header, main h1, main h2, main h3, main p, main ul, main ol, main li, main a, main form, main aside, main details, main summary, main label, main input, main select, main textarea, main button, footer, footer *";
        // home: the sticky stacks (intro, cards) are measured in flow at scroll 0 only
        const els = [...document.querySelectorAll(sel)].filter((e) => !e.closest("canvas"));
        const res = els.map((e) => {
          const r = e.getBoundingClientRect();
          const cs = getComputedStyle(e);
          return {
            tag: e.tagName.toLowerCase(),
            box: [Math.round(r.left * 10) / 10, Math.round((r.top + scrollY) * 10) / 10, Math.round(r.width * 10) / 10, Math.round(r.height * 10) / 10],
            text: e.children.length ? null : (e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 120),
            href: e.getAttribute("href"),
            residue: [cs.opacity !== "1" && !e.closest("[data-card], [data-copy]") ? `opacity:${cs.opacity}` : "", cs.filter !== "none" ? `filter:${cs.filter}` : "", cs.willChange !== "auto" && !e.closest("[data-card]") ? `will-change:${cs.willChange}` : ""].filter(Boolean).join(" "),
          };
        });
        const headings = [...document.querySelectorAll("h1, h2, h3")].map((e) => `${e.tagName}:${e.textContent.trim().slice(0, 60)}`);
        return { docHeight: document.documentElement.scrollHeight, overflowX: document.documentElement.scrollWidth - innerWidth, headings, nodes: res };
      });
      if (SHOT_VIEWPORTS.has(`${w}x${h}`)) {
        const slug = route === "/" ? "home" : route.slice(1).replace(/\//g, "-");
        await page.screenshot({ path: path.join(OUT, `${slug}-${w}x${h}-top.png`) });
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(1400);
        await page.screenshot({ path: path.join(OUT, `${slug}-${w}x${h}-end.png`) });
      }
      process.stdout.write(".");
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, "layout.json"), JSON.stringify(result));
  console.log(`\n${Object.keys(result).length} route×viewport fingerprints → ${path.relative(ROOT, OUT)}`);
}

function compare(before, after) {
  const A = JSON.parse(fs.readFileSync(path.join(OUTROOT, before, "layout.json"), "utf8"));
  const B = JSON.parse(fs.readFileSync(path.join(OUTROOT, after, "layout.json"), "utf8"));
  const failures = [];
  let nodes = 0;
  let legacy = 0;
  for (const key of Object.keys(A)) {
    const x = A[key], y = B[key];
    if (!y) { failures.push(`${key}: missing after`); continue; }
    if (x.headings.join("|") !== y.headings.join("|")) failures.push(`${key}: heading order/text changed`);
    if (Math.abs(x.docHeight - y.docHeight) > 1) failures.push(`${key}: document height ${x.docHeight} → ${y.docHeight}`);
    if (y.overflowX > 0) failures.push(`${key}: horizontal overflow ${y.overflowX}px`);
    if (x.nodes.length !== y.nodes.length) { failures.push(`${key}: ${x.nodes.length} → ${y.nodes.length} nodes`); continue; }
    let worst = 0, where = "";
    x.nodes.forEach((n, i) => {
      const m = y.nodes[i];
      nodes++;
      if (n.tag !== m.tag || n.text !== m.text || n.href !== m.href) failures.push(`${key}: node ${i} ${n.tag} "${n.text}" → ${m.tag} "${m.text}" (${n.href} → ${m.href})`);
      const delta = n.box.map((v, k) => +(v - m.box[k]).toFixed(1));
      // The pre-task baseline measured the retired CSS view-timeline .reveal (Services/Process/Principles on / and
      // /about) in its pre-entry state at scroll 0: translateY(1.5rem) included in getBoundingClientRect. That is a
      // transform in the baseline, not layout: exactly +24 px vertical, same x/width/height, only on those routes.
      const legacyReveal = (key.startsWith("/ @") || key.startsWith("/about @")) && delta[0] === 0 && delta[2] === 0 && delta[3] === 0 && Math.abs(delta[1] - 24) <= 0.2;
      if (legacyReveal) { legacy++; return; }
      const d = Math.max(...delta.map(Math.abs));
      if (d > worst) { worst = d; where = `${n.tag} "${(n.text || "").slice(0, 30)}"`; }
      if (m.residue && m.residue !== n.residue) failures.push(`${key}: residue on ${m.tag} "${(m.text || "").slice(0, 30)}": ${m.residue}`);
    });
    if (worst > 1) failures.push(`${key}: box moved ${worst.toFixed(1)}px (${where})`);
  }
  console.log(`${Object.keys(A).length} fingerprints, ${nodes} nodes compared; ${legacy} explained by the baseline's retired .reveal pre-entry transform (exactly +24 px vertical, / and /about only)`);
  if (failures.length) {
    console.log(`${failures.length} FAILED:\n` + failures.slice(0, 60).map((f) => "  ✗ " + f).join("\n"));
    process.exit(1);
  }
  console.log("PASS: settled layout, copy, links, heading order identical (≤ 1 px), no residue, no overflow");
}

if (mode === "capture") await capture(a, b);
else if (mode === "compare") compare(a, process.argv[4]);
else console.log("usage: capture <name> [base] | compare <before> <after>");
