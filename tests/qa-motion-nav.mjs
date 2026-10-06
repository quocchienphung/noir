#!/usr/bin/env node
// Sitewide motion: navigation playback and behaviour (prompt/NOIR_SITEWIDE_AITHOR_MOTION_MASTER.md §5, §7).
// Usage: node tests/qa-motion-nav.mjs [baseUrl=http://localhost:3000] [outName=nav]
// Every check samples the real page per animation frame (no single end screenshot): page-surface opacity,
// pathname, H1 opacity/filter, header opacity. Milestones: click, exit start/end, commit, enter start/end, H1
// start/settled. Writes docs/research/sitewide-motion/<outName>/nav-trace.json (+ frame strips).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const base = process.argv[2] || "http://localhost:3000";
const OUT = path.join(ROOT, "docs/research/sitewide-motion", process.argv[3] || "nav");
fs.mkdirSync(OUT, { recursive: true });
const failures = [];
const notes = [];
const check = (ok, m) => (ok ? notes.push(`ok  ${m}`) : failures.push(m));
const traces = {};

const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });

async function open(viewport = { width: 1440, height: 900 }, opts = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !/Failed to load resource.*404/.test(m.text()) && errors.push(m.text().slice(0, 200)));
  return { ctx, page, errors };
}
const settle = (page, ms = 2600) => page.waitForTimeout(ms);

/** Starts a per-frame sampler; returns a function that stops it and returns the samples. */
async function sampler(page) {
  await page.evaluate(() => {
    window.__s = [];
    window.__t0 = performance.now();
    window.__click = null;
    // t = 0 is the user's input (pointerdown / Enter), not the sampler start
    const mark = () => { if (window.__click === null) window.__click = performance.now() - window.__t0; };
    addEventListener("pointerdown", mark, { capture: true, once: true });
    addEventListener("keydown", (e) => e.key === "Enter" && mark(), { capture: true, once: true });
    const gen = (window.__gen = (window.__gen || 0) + 1);
    const tick = () => {
      if (window.__gen !== gen) return;
      const c = document.getElementById("content");
      const f = document.querySelector("footer");
      const h1 = document.querySelector("#content h1");
      const hdr = document.querySelector("header");
      window.__s.push({
        t: Math.round(performance.now() - window.__t0),
        path: location.pathname,
        y: Math.round(scrollY),
        content: +getComputedStyle(c).opacity,
        footer: f ? +getComputedStyle(f).opacity : null,
        header: hdr ? +getComputedStyle(hdr).opacity : null,
        h1: h1 ? +getComputedStyle(h1).opacity : null,
        h1f: h1 ? getComputedStyle(h1).filter : null,
        h1text: h1 ? h1.textContent.trim().slice(0, 24) : null,
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  return async () =>
    page.evaluate(() => {
      window.__gen++;
      const c = window.__click ?? 0;
      return window.__s.map((x) => ({ ...x, t: x.t - Math.round(c) }));
    });
}

function milestones(s, fromPath, toPath) {
  const first = (pred) => s.find(pred)?.t ?? null;
  const exitStart = first((x) => x.t >= 0 && x.path === fromPath && x.content < 0.99);
  const exitEnd = first((x) => x.content <= 0.01);
  const commit = first((x) => x.path === toPath);
  const enterStart = first((x) => x.path === toPath && x.content > 0.01);
  const enterEnd = first((x) => x.path === toPath && x.content >= 0.99);
  const h1Start = first((x) => x.path === toPath && x.h1 !== null && x.h1 > 0.01 && x.content > 0.01);
  const h1Settled = first((x) => x.path === toPath && x.h1 === 1 && x.h1f === "none" && x.content >= 0.99);
  const headerMin = Math.min(...s.map((x) => x.header ?? 1));
  const flashOld = s.some((x, i) => i > 0 && x.path === toPath && s[i - 1].path === toPath && x.content > 0.5 && (enterStart === null || x.t < enterStart));
  const scrollAtReveal = s.find((x) => x.path === toPath && x.content > 0.01)?.y ?? null;
  return { exitStart, exitEnd, commit, enterStart, enterEnd, h1Start, h1Settled, headerMin, flashOld, scrollAtReveal };
}

async function navCheck(label, page, clickSel, fromPath, toPath, { keyboard = false } = {}) {
  const stop = await sampler(page);
  await page.waitForTimeout(80);
  if (keyboard) {
    await page.focus(clickSel);
    await page.keyboard.press("Enter");
  } else await page.click(clickSel);
  await page.waitForURL((u) => new URL(u).pathname === toPath, { timeout: 15000 });
  await settle(page, 2800);
  const s = await stop();
  const m = milestones(s, fromPath, toPath);
  traces[label] = { milestones: m, samples: s };
  return m;
}

// ---------------------------------------------------------------------------------------------- A. header nav chain
{
  const { ctx, page, errors } = await open();
  await page.goto(`${base}/`, { waitUntil: "load" });
  await settle(page);
  const chain = [
    ["/", "/projects", 'header nav a[href="/projects"]'],
    ["/projects", "/about", 'header nav a[href="/about"]'],
    ["/about", "/contact", 'header nav a[href="/contact"]'],
    ["/contact", "/privacy-policy", 'footer a[href="/privacy-policy"]'],
    ["/privacy-policy", "/", 'header a[aria-label="NOIR — home"]'],
  ];
  for (const [from, to, sel] of chain) {
    if (sel.startsWith("footer")) {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await settle(page, 1200);
    }
    const m = await navCheck(`${from} → ${to}`, page, sel, from, to);
    const exitDur = m.exitEnd - m.exitStart;
    const enterDelay = m.enterStart - m.commit;
    const enterDur = m.enterEnd - m.enterStart;
    // Home mounts WebGL renderers on arrival: the coordinator waits for their first frame (BlackHoleCanvas
    // data-ready) before the 300 ms enter delay counts down, so its fade is played in full, not swallowed
    const maxDelay = to === "/" ? 1600 : 450;
    check(
      m.exitStart !== null && m.exitStart < 120 && exitDur >= 450 && exitDur <= 800 && m.commit >= m.exitEnd && enterDelay >= 200 && enterDelay <= maxDelay && enterDur >= 400 && enterDur <= 800 && m.headerMin === 1 && !m.flashOld,
      `A ${from} → ${to} via ${sel.split(" ")[0]}: exit starts ${m.exitStart} ms after click, lasts ${exitDur} ms; commit ${m.commit} ms; enter after ${enterDelay} ms, lasts ${enterDur} ms; header opacity min ${m.headerMin}; old page never flashes back`,
    );
    check(m.scrollAtReveal === 0, `A ${from} → ${to}: destination revealed at scroll ${m.scrollAtReveal}`);
    if (to !== "/") check(m.h1Settled !== null && m.h1Start >= m.enterStart, `A ${to}: H1 appears from ${m.h1Start} ms, settled (opacity 1, filter none) at ${m.h1Settled} ms`);
  }
  check(errors.length === 0, `A no page errors (${errors.join(" | ") || "none"})`);
  await ctx.close();
}

// ---------------------------------------------------------------------------- B. Home at Complexity → About (header)
{
  const { ctx, page } = await open();
  await page.goto(`${base}/`, { waitUntil: "load" });
  await settle(page);
  await page.evaluate(() => {
    const c = document.querySelector('section[aria-labelledby="noir-cinematic-title"]');
    window.scrollTo(0, Math.round(c.getBoundingClientRect().top + scrollY + 0.5 * (c.offsetHeight - innerHeight)));
  });
  await settle(page, 1500);
  const m = await navCheck("Complexity → /about", page, 'header nav a[href="/about"]', "/", "/about");
  const s = traces["Complexity → /about"].samples;
  const yDuringExit = s.filter((x) => x.path === "/" && x.content > 0.05).map((x) => x.y);
  check(Math.min(...yDuringExit) > 1000 && m.scrollAtReveal === 0, `B from Complexity: outgoing stays at its scroll (≥ ${Math.min(...yDuringExit)} px) while fading, About revealed at top (${m.scrollAtReveal})`);
  await ctx.close();
}

// ---------------------------------------------------------------- C. every entry point goes through the coordinator
{
  const entries = [
    ["/", "header CTA", 'header a[href="/contact"]:not(nav a)', "/contact"],
    ["/", "intro CTA", 'section[aria-labelledby="noir-intro-title"] a[href="/projects"]', "/projects"],
    ["/about", "ButtonLink", 'main a[href="/contact"]', "/contact"],
    ["/projects", "card text link", 'main ul a[href="/about"]', "/about"],
    ["/projects", "inline Contact link", 'main p a[href="/contact"]', "/contact"],
    ["/404", "404 recovery", 'main a[href="/"]', "/"],
    ["/this-route-does-not-exist", "unknown-route recovery", 'main a[href="/"]', "/"],
    ["/about", "footer CTA", 'footer a[href="/contact"]', "/contact"],
  ];
  for (const [from, label, sel, to] of entries) {
    const { ctx, page } = await open();
    await page.goto(`${base}${from}`, { waitUntil: "load" });
    await settle(page);
    await page.locator(sel).first().scrollIntoViewIfNeeded();
    await settle(page, 1200);
    const m = await navCheck(`${label} ${from} → ${to}`, page, sel, new URL(base + from).pathname, to);
    check(m.exitStart !== null && m.exitEnd !== null && m.commit >= m.exitEnd && m.enterStart > m.commit, `C ${label} (${from} → ${to}): coordinated fade (exit ${m.exitStart}–${m.exitEnd} ms, commit ${m.commit}, enter ${m.enterStart}–${m.enterEnd})`);
    await ctx.close();
  }
}

// -------------------------------------------------------------------------------------- D. mobile drawer → route
{
  const { ctx, page } = await open({ width: 390, height: 844 }, { hasTouch: true });
  await page.goto(`${base}/about`, { waitUntil: "load" });
  await settle(page);
  for (const to of ["/projects", "/contact", "/"]) {
    await page.click('header button[aria-controls="noir-menu"]');
    await page.waitForTimeout(600);
    const from = await page.evaluate(() => location.pathname);
    const m = await navCheck(`drawer ${from} → ${to}`, page, `#noir-menu a[href="${to}"]`, from, to);
    const state = await page.evaluate(() => ({ open: document.getElementById("noir-menu").hasAttribute("data-open"), overflow: document.documentElement.style.overflow, active: document.activeElement?.closest("#noir-menu") ? "drawer" : document.activeElement?.tagName }));
    check(m.exitEnd !== null && m.enterEnd !== null && !state.open && state.overflow === "" && state.active !== "drawer", `D drawer → ${to}: one fade out/in (exit ${m.exitStart}–${m.exitEnd}, enter ${m.enterStart}–${m.enterEnd}), drawer closed, scroll lock released, focus left the drawer (${state.active})`);
  }
  // Escape / resize still work
  await page.click('header button[aria-controls="noir-menu"]');
  await page.waitForTimeout(500);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  const esc = await page.evaluate(() => ({ open: document.getElementById("noir-menu").hasAttribute("data-open"), focus: document.activeElement?.getAttribute("aria-controls") }));
  check(!esc.open && esc.focus === "noir-menu", "D Escape closes the drawer and returns focus to Menu");
  await ctx.close();
}

// --------------------------------------------------------- E. Back/Forward restoration, rapid clicks, same route, modifier
{
  const { ctx, page } = await open();
  await page.goto(`${base}/about`, { waitUntil: "load" });
  await settle(page);
  await page.evaluate(() => window.scrollTo(0, 1400));
  await settle(page, 1200);
  await page.click('header nav a[href="/projects"]');
  await page.waitForURL("**/projects");
  await settle(page, 2600);
  const stop = await sampler(page);
  await page.goBack();
  await page.waitForURL("**/about");
  await settle(page, 1500);
  const s = await stop();
  const back = await page.evaluate(() => ({ y: Math.round(scrollY), hidden: [...document.querySelectorAll("#content [data-m]")].filter((e) => { const r = e.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && +getComputedStyle(e).opacity < 0.99; }).length }));
  const minContent = Math.min(...s.filter((x) => x.path === "/about").map((x) => x.content));
  check(back.y > 1000 && back.hidden === 0 && minContent >= 0.99, `E Back restores /about at scroll ${back.y} with everything in view visible (page never hidden: min opacity ${minContent})`);
  await page.goForward();
  await page.waitForURL("**/projects");
  await settle(page, 1200);
  check((await page.evaluate(() => location.pathname)) === "/projects", "E Forward works");

  // rapid clicks: About then Contact within the exit → only the latest destination, one transition
  await page.goto(`${base}/`, { waitUntil: "load" });
  await settle(page);
  const stop2 = await sampler(page);
  await page.click('header nav a[href="/about"]');
  await page.waitForTimeout(150);
  await page.click('header nav a[href="/contact"]');
  await page.waitForURL("**/contact", { timeout: 15000 });
  await settle(page, 2600);
  const s2 = await stop2();
  const paths = [...new Set(s2.map((x) => x.path))];
  const final = s2[s2.length - 1];
  check(paths.join(">") === "/>/contact" && final.content === 1, `E rapid clicks About→Contact: path sequence ${paths.join(" > ")}, settled visible`);

  // same-route click: no fade, no hang
  const stop3 = await sampler(page);
  await page.click('header nav a[href="/contact"]');
  await settle(page, 1200);
  const s3 = await stop3();
  check(Math.min(...s3.map((x) => x.content)) >= 0.99, "E same-route click does not fade or hang");

  // modifier click opens a new tab and leaves this page untouched
  const stop4 = await sampler(page);
  const [popup] = await Promise.all([ctx.waitForEvent("page", { timeout: 5000 }).catch(() => null), page.click('header nav a[href="/about"]', { modifiers: ["Control"] })]);
  await page.waitForTimeout(800);
  const s4 = await stop4();
  check(!!popup && (await page.evaluate(() => location.pathname)) === "/contact" && Math.min(...s4.map((x) => x.content)) >= 0.99, `E Ctrl-click opens a new tab (${!!popup}) without fading this page`);
  if (popup) await popup.close();

  // keyboard Enter: coordinated, focus moved to the content region
  const mk = await navCheck("keyboard /contact → /about", page, 'header nav a[href="/about"]', "/contact", "/about", { keyboard: true });
  const focus = await page.evaluate(() => document.activeElement?.id);
  check(mk.exitEnd !== null && mk.enterEnd !== null && focus === "content", `E keyboard Enter navigates with the transition; focus lands on #${focus}`);
  await ctx.close();
}

// ------------------------------------------------------------------------- F. direct load / reload entrance per route
{
  const { ctx, page, errors } = await open();
  for (const route of ["/about", "/projects", "/contact", "/privacy-policy", "/404", "/this-route-does-not-exist"]) {
    await page.goto(`${base}${route}`, { waitUntil: "commit" });
    const s = [];
    const t0 = Date.now();
    while (Date.now() - t0 < 2600) {
      s.push(await page.evaluate(() => { const h = document.querySelector("#content h1"); return h ? { o: +getComputedStyle(h).opacity, f: getComputedStyle(h).filter } : null; }).catch(() => null));
      await page.waitForTimeout(60);
    }
    const seen = s.filter(Boolean);
    const rose = seen.some((x) => x.o < 0.5) && seen[seen.length - 1].o === 1 && seen[seen.length - 1].f === "none";
    check(rose, `F direct load ${route}: H1 enters (min opacity ${Math.min(...seen.map((x) => x.o)).toFixed(2)}) and settles at opacity 1, filter none`);
  }
  check(errors.length === 0, `F no page errors on direct loads (${errors.join(" | ") || "none"})`);
  await ctx.close();
}

// ----------------------------------------------------------- G. viewport reveals: below fold hidden, reveal once, no ghost focus
{
  const { ctx, page } = await open();
  await page.goto(`${base}/about`, { waitUntil: "load" });
  await settle(page);
  const before = await page.evaluate(() => {
    const els = [...document.querySelectorAll("#content [data-m], footer [data-m]")];
    return { below: els.filter((e) => e.getBoundingClientRect().top > innerHeight && e.hasAttribute("data-pending")).length, total: els.length };
  });
  // scroll down slowly, then back up: items reveal once and stay
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= H; y += 300) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(90);
  }
  await settle(page, 1500);
  const down = await page.evaluate(() => [...document.querySelectorAll("#content [data-m], footer [data-m]")].filter((e) => !e.hasAttribute("data-shown")).length);
  await page.evaluate(() => window.scrollTo(0, 0));
  await settle(page, 800);
  const residue = await page.evaluate(() => [...document.querySelectorAll("#content [data-m], footer [data-m]")].filter((e) => { const cs = getComputedStyle(e); return cs.opacity !== "1" || cs.transform !== "none" || cs.filter !== "none" || e.getAnimations().length; }).length);
  check(before.below > 0 && down === 0 && residue === 0, `G /about: ${before.below} of ${before.total} targets wait below the fold, all revealed after scrolling, none left with opacity/transform/filter/animation`);
  // keyboard into a hidden target: shown at once
  await page.goto(`${base}/about`, { waitUntil: "load" });
  await settle(page);
  await page.focus("footer a[href='/contact']");
  await page.waitForTimeout(100);
  const ghost = await page.evaluate(() => { let o = 1; for (let e = document.activeElement; e; e = e.parentElement) o *= +getComputedStyle(e).opacity; return o; });
  check(ghost > 0.95, `G focusing a link inside a not-yet-revealed footer group shows it at once (effective opacity ${ghost.toFixed(2)})`);
  await ctx.close();
}

// --------------------------------------------------------------------------- H. reduced motion and JavaScript off
{
  const { ctx, page } = await open({ width: 1440, height: 900 }, { reducedMotion: "reduce" });
  await page.goto(`${base}/about`, { waitUntil: "load" });
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => ({ hidden: [...document.querySelectorAll("[data-m]")].filter((e) => +getComputedStyle(e).opacity < 1).length }));
  const stop = await sampler(page);
  await page.click('header nav a[href="/projects"]');
  await page.waitForURL("**/projects");
  await page.waitForTimeout(600);
  const s = await stop();
  check(r.hidden === 0 && Math.min(...s.map((x) => x.content)) >= 0.99, `H reduced motion: no hidden state (${r.hidden}), navigation without fade`);
  await ctx.close();
  const js = await open({ width: 1440, height: 900 }, { javaScriptEnabled: false });
  await js.page.goto(`${base}/about`, { waitUntil: "load" });
  await js.page.waitForTimeout(400);
  const hiddenNoJs = await js.page.evaluate(() => [...document.querySelectorAll("[data-m]")].filter((e) => +getComputedStyle(e).opacity < 1).length);
  check(hiddenNoJs === 0, `H JavaScript off: every target visible (${hiddenNoJs} hidden)`);
  await js.ctx.close();
}

// ------------------------------------------------------------------------ I. slow / never-committing navigation
{
  const { ctx, page } = await open();
  await page.goto(`${base}/about`, { waitUntil: "load" });
  await settle(page);
  // stall every RSC/navigation request so the route can never commit
  await page.route("**/*", (route) => {
    const h = route.request().headers();
    if (h.rsc || h["next-router-state-tree"] || route.request().url().includes("_rsc")) return; // never answered
    return route.continue();
  });
  await page.click('header nav a[href="/contact"]');
  await page.waitForTimeout(10000);
  const r = await page.evaluate(() => ({ path: location.pathname, content: +getComputedStyle(document.getElementById("content")).opacity, overflow: document.documentElement.style.overflow }));
  check(r.content === 1 && r.overflow === "", `I navigation that never commits: page restored visible after the fail-safe (path ${r.path}, opacity ${r.content})`);
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, "nav-trace.json"), JSON.stringify(traces, null, 1));
console.log(notes.join("\n"));
if (failures.length) {
  console.error(`\n${failures.length} FAILED:\n` + failures.map((f) => "  ✗ " + f).join("\n"));
  process.exit(1);
}
console.log(`\nall ${notes.length} checks passed`);
