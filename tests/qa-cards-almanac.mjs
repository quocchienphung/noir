#!/usr/bin/env node
// Cards Almanac acceptance (prompt/cards-almanac/03_QA.md). Usage: node tests/qa-cards-almanac.mjs [baseUrl=http://localhost:3000]
// Dev-only fixtures (?almanacFixture=…, /qa/embed-fixture) need `next dev`; against production those checks are
// reported as skipped, never as passed.
//
// Pure logic (lib/noir/cards-almanac/stack.ts, data):
//   A1 settled stack: covered layers recede 0.036 per layer, no lean, full copy, cover zoomed to 1.06
//   A2 deterministic & continuous: the same measures give the same frames; no jumps along a scroll sweep
//   A3 long lists stay compact: ≤ cap back layers keep a visible band, nothing travels above the oldest band
//   A4 release: every card follows the front card's release offset (the stack leaves as one)
//   A6 glide: drawn offset = visual − layout; at rest (visual = layout) the frame is the deterministic one
//   A5 data honesty: liveUrl null everywhere, empty slots explain themselves, unique ids, covers exist with
//      provenance, no fixture card in the shipped config, capabilities copy carried once
// Browser:
//   C1 server HTML: capabilities (one h2, six pillars, /contact + /projects), every card, no archive runtime
//   C2 runtime graph: no archive canvas/global/query handler; canvases on / belong to the intro and Complexity only
//   C3 geometry at 1440×900: front card readable, bands ≈ 3.55 % of card width, back scale ≈ 1 − 0.036·depth,
//      and a hold after the last card before the stack releases
//   C4 reverse scroll and jumps (Home/End, scrollbar-like jumps) converge to identical transforms
//   C5 keyboard: Tab reaches each plus control, the focused card becomes the unobstructed front card
//   C6 details dialog: opens the right project, focus inside, Tab stays inside, Escape closes, focus and scroll
//      position restored
//   C7 live embed (dev fixture): no iframe until requested, one at a time, sandbox without same-origin, removed on
//      close; link-only policy shows no embed button; new-tab link always present
//   C8 reduced motion: stable list, no transforms, every card in flow
//   C9 no Pause control (removed at the user's request); a stale `noir-motion-paused` value cannot hide the stack
//   C16 glide: after one wheel step the incoming card trails its layout position and eases in — no jump, no overshoot,
//       at rest exactly on the layout (A6 checks the same in pure logic)
//   C10 phone 390×844, short landscape 844×390 and 200 % zoom: list layout, no horizontal overflow, 44 px controls
//   C11 one-card and zero-card configurations (dev fixture): no giant empty track
//   C12 idle: no animation frames scheduled by the page while resting in the section
//   C13 contrast of section text ≥ 4.5 : 1 (meta, body, eyebrow, pill, note) and of the fixed header's nav links
//       over the light section (scoped denser glass; hero and Complexity keep the original header)
//   C14 no console errors / hydration warnings on load and scroll
//   C15 protected files unchanged against docs/research/cards-almanac/implementation/protected-before.json
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { chromium } from "playwright";
import { loadTs } from "./lib/load-ts.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const base = process.argv[2] || "http://localhost:3000";
const failures = [];
const notes = [];
const check = (ok, m) => (ok ? notes.push(`ok  ${m}`) : failures.push(m));
const skip = (m) => notes.push(`--  ${m} (skipped)`);

const ST = await loadTs(path.join(ROOT, "src/lib/noir/cards-almanac/stack.ts"));
const D = await loadTs(path.join(ROOT, "src/data/noir/cards-almanac.ts"));
const SITE = await loadTs(path.join(ROOT, "src/data/noir/site.ts"));
const { STACK, stackFrames } = ST;

// ================================================================================ pure logic
{
  // A1 settled 3-card stack
  const f = stackFrames([0, 0, 0].map(() => ({ remaining: 0, range: 700 })), 40);
  const ok =
    Math.abs(f[0].scale - (1 - 2 * STACK.scaleStep)) < 1e-9 &&
    Math.abs(f[1].scale - (1 - STACK.scaleStep)) < 1e-9 &&
    f[2].scale === 1 &&
    f.every((x) => x.rotateX === 0 && x.copyOpacity === 1 && Math.abs(x.coverScale - 1 - STACK.zoom) < 1e-9 && x.translateY === 0);
  check(ok, `A1 settled stack: scales ${f.map((x) => x.scale.toFixed(3)).join(" / ")}, no lean, full copy, cover ×${(1 + STACK.zoom).toFixed(2)}`);
}
{
  // A2 sweep: 6 cards, pinned tops 120 + i·40 (cap 4), pitch 800, viewport 900
  const n = 6, vh = 900, pitch = 800, top0 = 1000;
  const pinned = Array.from({ length: n }, (_, i) => 120 + Math.min(i, STACK.cap) * 40);
  const at = (y) =>
    stackFrames(
      pinned.map((p, i) => {
        const natural = top0 + i * pitch - y; // unstuck top on screen
        return { remaining: Math.max(natural, p) - p, range: vh - p };
      }),
      40,
    );
  let maxJump = 0;
  let prev = at(0);
  for (let y = 1; y <= 6000; y++) {
    const f = at(y);
    for (let i = 0; i < n; i++) maxJump = Math.max(maxJump, Math.abs(f[i].translateY - prev[i].translateY), Math.abs(f[i].scale - prev[i].scale) * 1000, Math.abs(f[i].rotateX - prev[i].rotateX) * 10);
    prev = f;
  }
  const same = JSON.stringify(at(2345.5)) === JSON.stringify(at(2345.5));
  check(same && maxJump < 1, `A2 deterministic and continuous over a 6000 px sweep (largest per-px change ${maxJump.toFixed(3)})`);
}
{
  // A3 8 settled cards
  const f = stackFrames(Array.from({ length: 8 }, () => ({ remaining: 0, range: 700 })), 40);
  const top = f.map((x, i) => Math.min(i, STACK.cap) * 40 + x.translateY);
  // a card is hidden when a later card (painted above it) has the same top and is at least as wide
  const hidden = f.map((x, i) => f.some((y, k) => k > i && Math.abs(top[k] - top[i]) < 1e-9 && y.scale >= x.scale));
  const visible = hidden.filter((h) => !h).length;
  check(visible === STACK.cap + 1 && Math.min(...top) >= 0, `A3 8 settled cards: ${visible} visible (front + ${STACK.cap} bands), ${8 - visible} tucked fully under the oldest band, highest offset ${Math.min(...top)} px (≥ 0)`);
}
{
  // A4 release by 120 px: the front card is pushed 120 px above its pin, the back ones (pinned higher) less
  const f = stackFrames([{ remaining: -0, range: 700 }, { remaining: -0, range: 700 }, { remaining: -120, range: 700 }], 40);
  check(f[0].translateY === -120 && f[1].translateY === -120 && f[2].translateY === 0, `A4 release: back cards follow the front card (${f.map((x) => x.translateY).join(", ")} px + front's own −120)`);
}
{
  // A6 glide: a card drawn behind its layout position is offset by exactly the difference; at rest identical
  const m = [{ remaining: 0, range: 700 }, { remaining: 300, range: 700 }];
  const rest = stackFrames(m, 40);
  const glide = stackFrames([m[0], { ...m[1], visual: 360 }], 40);
  const same = stackFrames([{ ...m[0], visual: 0 }, { ...m[1], visual: 300 }], 40);
  check(Math.abs(glide[1].translateY - rest[1].translateY - 60) < 1e-9 && glide[1].progress < rest[1].progress && JSON.stringify(same) === JSON.stringify(rest), "A6 glide offsets the drawn card by visual − layout and eases its progress; visual = layout gives the deterministic frame");
}
{
  // A5 data honesty
  const cards = D.cardsAlmanac.cards;
  const slots = cards.flatMap((c) => c.sections);
  const ids = new Set(cards.map((c) => c.id));
  check(slots.every((x) => x.liveUrl === null && x.readiness !== "live"), `A5 no live URL invented (${slots.length} slots, all liveUrl null)`);
  check(slots.filter((x) => x.readiness === "empty").every((x) => x.emptyMessage.length > 0), "A5 every empty slot carries an honest message");
  check(ids.size === cards.length && cards.every((c) => c.kind !== "fixture"), `A5 ${cards.length} unique cards, no dev fixture in the shipped config`);
  const exp = cards.filter((c) => c.kind === "experiment");
  check(
    exp.length === SITE.work.experiments.length && exp.every((c) => { const e = SITE.work.experiments.find((x) => x.id === c.sourceExperimentId); return e && c.title === e.title && c.description === e.body && c.year === e.year; }),
    `A5 experiment cards mirror work.experiments (titles, bodies, years) — ${exp.map((c) => c.id).join(", ")}`,
  );
  const covers = cards.filter((c) => c.cover);
  check(covers.every((c) => fs.existsSync(path.join(ROOT, "public", c.cover.src)) && c.cover.provenance.length > 10 && c.cover.alt.length > 10), `A5 ${covers.length} covers exist under public/ with alt text and provenance`);
}

// ================================================================================ browser
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const SEC = "#work";
const isDev = await (async () => {
  const r = await fetch(`${base}/qa/embed-fixture`).catch(() => null);
  return !!r && r.status === 200;
})();
async function openPage(opts = {}, query = "") {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, ...opts });
  const page = await ctx.newPage();
  const logs = [];
  page.on("console", (m) => (m.type() === "error" || (m.type() === "warning" && /hydrat/i.test(m.text()))) && logs.push(m.text().slice(0, 300)));
  page.on("pageerror", (e) => logs.push(String(e)));
  await page.goto(`${base}/${query}`, { waitUntil: "load" });
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.waitForTimeout(800);
  return { ctx, page, logs };
}
const scrollTo = (page, y) => page.evaluate((y) => window.scrollTo(0, y), y);
/** Document scroll at which card i is pinned and the next has not started (same formula as the component). */
const settleY = (page, i) =>
  page.evaluate(
    ([SEC, i]) => {
      const list = document.querySelector(`${SEC} ol`);
      const li = list.children[i];
      const first = list.children[0];
      const pitch = first.offsetHeight + (list.children[1] ? parseFloat(getComputedStyle(list.children[1]).marginTop) : 0);
      return Math.round(list.getBoundingClientRect().top + scrollY + i * pitch - parseFloat(getComputedStyle(li).top) + 1);
    },
    [SEC, i],
  );
const snapshot = (page) =>
  page.evaluate((SEC) => [...document.querySelectorAll(`${SEC} [data-card]`)].map((c) => `${c.style.transform}|${c.style.opacity}|${c.parentElement.querySelector("[data-copy]")?.style.opacity}`).join("\n"), SEC);
/** Waits until no card is gliding (the controller clears data-moving at rest), plus two frames. */
const frameSettle = async (page) => {
  await page.waitForFunction((SEC) => !document.querySelector(`${SEC} ol`)?.hasAttribute("data-moving"), SEC, { timeout: 5000 }).catch(() => {});
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};

{
  // C1 SSR
  const html = await (await fetch(`${base}/`)).text();
  const C = SITE.home.capabilities;
  const titleCount = html.split('id="noir-capabilities-title"').length - 1;
  const pillars = C.pillars.every((p) => html.includes(`</span>${p}</li>`));
  const esc = (t) => t.replace(/&/g, "&amp;");
  const cards = D.cardsAlmanac.cards.every((c) => html.includes(esc(c.title)) && html.includes(`id="card-${c.id}"`));
  check(titleCount === 1 && pillars && html.includes('href="/contact"') && html.includes('href="/projects"'), `C1 server HTML: one capabilities heading, six pillars, /contact and /projects links`);
  check(cards, `C1 server HTML holds every card (${D.cardsAlmanac.cards.length}) with its anchor`);
  check(!/Temporal archive|noir-archive|TesseractCanvas|data-cell-button/.test(html), "C1 no archive markup in the server HTML");
}

{
  // C2 runtime graph + C14 console
  const { ctx, page, logs } = await openPage();
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  for (const y of [0.3, 0.6, 0.9]) {
    await page.evaluate(([SEC, p]) => { const t = document.querySelector(SEC); const r = t.getBoundingClientRect(); scrollTo(0, Math.round(scrollY + r.top + p * (r.height - innerHeight))); }, [SEC, y]);
    await page.waitForTimeout(400);
  }
  const g = await page.evaluate((SEC) => ({
    archive: "__archive" in window,
    inSection: document.querySelectorAll(`${SEC} canvas`).length,
    owners: [...document.querySelectorAll("canvas")].map((c) => c.closest("section")?.getAttribute("aria-labelledby") ?? "none"),
  }), SEC);
  check(!g.archive && g.inSection === 0 && g.owners.every((o) => o === "noir-intro-title" || o === "noir-cinematic-title"), `C2 no archive runtime: __archive ${g.archive}, canvases in the section ${g.inSection}, canvas owners [${g.owners.join(", ")}]`);
  const loaded = await page.evaluate(() => performance.getEntriesByType("resource").map((e) => e.name));
  const all = [...loaded, ...requests];
  const old = all.filter((u) => /tesseract|archive-fixture|wormhole/i.test(u));
  check(old.length === 0, `C2 no retired archive chunk among ${all.length} loaded resources${old.length ? ": " + old.slice(0, 3).join(", ") : ""}`);
  check(logs.length === 0, `C14 no console errors or hydration warnings (${logs.length}${logs.length ? ": " + logs.join(" | ") : ""})`);
  await ctx.close();
}

{
  // C3 geometry + C4 reverse/jumps + C12 idle
  const { ctx, page } = await openPage();
  const n = await page.evaluate((SEC) => document.querySelectorAll(`${SEC} ol > li`).length, SEC);
  const flow = await page.evaluate((SEC) => document.querySelector(SEC).hasAttribute("data-flow"), SEC);
  check(!flow && n >= 2, `C3 desktop 1440×900 uses the stack (${n} cards)`);
  const geo = [];
  for (let i = 0; i < n; i++) {
    await scrollTo(page, await settleY(page, i));
    await page.waitForTimeout(250);
    await frameSettle(page);
    geo.push(
      await page.evaluate(
        ([SEC, i]) => {
          const cards = [...document.querySelectorAll(`${SEC} [data-card]`)];
          const r = cards.map((c) => c.getBoundingClientRect());
          // visible = its own top band wins the hit test (older cards beyond the cap are tucked under the oldest band)
          const shown = cards.map((c, k) => { const b = r[k]; const hit = document.elementFromPoint(b.left + b.width / 2, b.top + 6); return hit?.closest("[data-card]") === c; });
          const front = cards[i];
          const plus = front.querySelector("button");
          const pr = plus.getBoundingClientRect();
          const hit = document.elementFromPoint(pr.left + pr.width / 2, pr.top + pr.height / 2);
          const copy = front.parentElement.querySelector("[data-copy]");
          return {
            // cards beyond the cap fade behind the oldest band: measure the visible ones
            tops: r.slice(0, i + 1).filter((_, k) => shown[k]).map((x) => Math.round(x.top)),
            widths: r.slice(0, i + 1).filter((_, k) => shown[k]).map((x) => Math.round(x.width)),
            hidden: shown.slice(0, i + 1).filter((v) => !v).length,
            transparent: cards.filter((c) => parseFloat(getComputedStyle(c).opacity) < 0.99).length,
            frontBottom: Math.round(r[i].bottom),
            vh: innerHeight,
            plusHit: plus.contains(hit),
            copyOpacity: getComputedStyle(copy).opacity,
          };
        },
        [SEC, i],
      ),
    );
  }
  const last = geo[n - 1];
  const gaps = last.tops.slice(1).map((t, k) => t - last.tops[k]);
  const fw = last.widths[last.widths.length - 1];
  const ratios = last.widths.map((w) => w / fw);
  const bandPct = (gaps[0] / fw) * 100;
  check(last.tops.length === Math.min(n, STACK.cap + 1) && last.hidden === n - last.tops.length && last.transparent === 0, `C3 with ${n} cards settled: ${last.tops.length} visible (front + ${last.tops.length - 1} bands), ${last.hidden} older tucked under the oldest band; ${last.transparent} transparent cards`);
  check(geo.every((g) => g.plusHit && g.copyOpacity === "1" && g.frontBottom <= g.vh), `C3 each settled front card is readable: copy opacity 1, plus control unobstructed, inside the viewport`);
  check(gaps.every((g) => g > 20 && g < 60) && bandPct > 2.6 && bandPct < 4.4, `C3 stacked top edges ${gaps.join(", ")} px (≈ ${bandPct.toFixed(2)} % of the card; reference ≈ 3.5 %)`);
  check(ratios.every((r, k) => Math.abs(r - (1 - STACK.scaleStep * (ratios.length - 1 - k))) < 0.012), `C3 back widths ${ratios.map((r) => r.toFixed(3)).join(" / ")} of the front (reference ≈ 0.964 per layer)`);

  // C3 hold: a third of a viewport after the last card pins, the whole stack is still pinned (no early release)
  await scrollTo(page, (await settleY(page, n - 1)) + 300);
  await page.waitForTimeout(200);
  await frameSettle(page);
  const hold = await page.evaluate((SEC) => [...document.querySelectorAll(`${SEC} ol > li`)].map((li) => Math.round(li.getBoundingClientRect().top - parseFloat(getComputedStyle(li).top))), SEC);
  check(hold.every((d) => Math.abs(d) <= 1), `C3 hold: 300 px after the last card pins every card is still pinned (offsets ${hold.join(", ")} px)`);

  // C4 reverse: forward pass, then backward over the same positions
  const ys = [];
  const y0 = await settleY(page, 0);
  const y1 = await settleY(page, n - 1);
  for (let k = 0; k <= 8; k++) ys.push(Math.round(y0 - 300 + ((y1 + 400 - (y0 - 300)) * k) / 8));
  const fwd = {};
  for (const y of ys) {
    await scrollTo(page, y);
    await page.waitForTimeout(120);
    await frameSettle(page);
    fwd[y] = await snapshot(page);
  }
  let reverseOk = true;
  for (const y of [...ys].reverse()) {
    await scrollTo(page, y);
    await page.waitForTimeout(120);
    await frameSettle(page);
    if ((await snapshot(page)) !== fwd[y]) reverseOk = false;
  }
  check(reverseOk, `C4 reverse scrolling gives identical transforms at ${ys.length} positions`);
  // jumps: End, Home, then straight back to a mid position
  const mid = ys[4];
  await page.keyboard.press("End");
  await page.waitForTimeout(400);
  await page.keyboard.press("Home");
  await page.waitForTimeout(400);
  await scrollTo(page, mid);
  await page.waitForTimeout(200);
  await frameSettle(page);
  check((await snapshot(page)) === fwd[mid], "C4 after End/Home and a direct jump the stack converges to the same frame");

  // C12 idle: count animation frames while resting in the section (black-hole canvases are off-screen and pause)
  await page.evaluate(() => {
    window.__rafN = 0;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => raf((t) => { window.__rafN++; cb(t); });
  });
  await page.waitForTimeout(1200);
  const idle = await page.evaluate(() => window.__rafN);
  check(idle <= 2, `C12 at rest in the section: ${idle} animation frame callbacks in 1.2 s (no perpetual loop)`);
  await ctx.close();
}

{
  // C5 keyboard + C6 dialog
  const { ctx, page } = await openPage();
  await scrollTo(page, (await settleY(page, 0)) - 200);
  await page.waitForTimeout(300);
  const n = await page.evaluate((SEC) => document.querySelectorAll(`${SEC} ol > li`).length, SEC);
  // focus the pause button (just before the list) and Tab through the plus controls
  await page.focus(`${SEC} header a[href="/projects"]`);
  const visits = [];
  for (let i = 0; i < n; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(350);
    await frameSettle(page);
    visits.push(
      await page.evaluate(() => {
        const a = document.activeElement;
        const li = a.closest("li[data-index]");
        const r = a.getBoundingClientRect();
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { label: a.getAttribute("aria-label"), index: li ? Number(li.dataset.index) : -1, unobstructed: a.contains(hit), w: r.width, h: r.height, focusRing: getComputedStyle(a).outlineStyle !== "none" };
      }),
    );
  }
  const names = new Set(visits.map((v) => v.label));
  check(visits.every((v, i) => v.index === i && v.unobstructed) && names.size === n, `C5 Tab visits each card's plus in order, each brought to the front unobstructed (${visits.map((v) => v.label).join(" → ")})`);
  check(visits.every((v) => v.w >= 44 && v.h >= 44 && v.focusRing), "C5 plus controls ≥ 44×44 px with a visible focus ring");

  // C6: open the dialog from the focused (last) plus with Enter
  const yBefore = await page.evaluate(() => scrollY);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const d = await page.evaluate(() => {
    const dlg = document.querySelector("dialog[open]");
    return { open: !!dlg, title: dlg?.querySelector("h2")?.textContent, focusInside: dlg?.contains(document.activeElement) ?? false, slots: dlg ? dlg.querySelectorAll("[data-slot]").length : 0 };
  });
  const lastCard = D.cardsAlmanac.cards[n - 1];
  check(d.open && d.title === lastCard.title && d.focusInside && d.slots === lastCard.sections.length, `C6 Enter opens “${d.title}” with focus inside and ${d.slots} demo sections`);
  let trapped = true;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    if (!(await page.evaluate(() => document.querySelector("dialog[open]")?.contains(document.activeElement) || document.activeElement === document.body))) trapped = false;
  }
  check(trapped, "C6 Tab stays inside the open dialog (background inert)");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({ open: !!document.querySelector("dialog[open]"), label: document.activeElement?.getAttribute("aria-label"), y: scrollY, overflow: document.documentElement.style.overflow }));
  check(!after.open && after.label === `View details for ${lastCard.title}` && Math.abs(after.y - yBefore) < 2 && after.overflow === "", `C6 Escape closes, focus back on “${after.label}”, scroll ${yBefore} → ${after.y}, page scroll unlocked`);
  // close button path
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  await page.click("dialog[open] button:has-text('Close')");
  await page.waitForTimeout(250);
  check(await page.evaluate(() => !document.querySelector("dialog[open]") && document.activeElement?.getAttribute("aria-label")?.startsWith("View details")), "C6 the Close button closes and restores focus");
  await ctx.close();
}

if (isDev) {
  // C7 live embed lifecycle (dev fixture)
  const { ctx, page } = await openPage({}, "?almanacFixture=6");
  await page.waitForFunction((SEC) => document.querySelectorAll(`${SEC} ol > li`).length === 6, SEC, { timeout: 10000 });
  await page.evaluate(() => document.querySelector("#card-open-slot button[aria-haspopup]").click());
  await page.waitForTimeout(300);
  const before = await page.evaluate(() => document.querySelectorAll("iframe").length);
  const linkOnly = await page.evaluate(() => {
    const li = document.querySelector('dialog[open] [data-slot="featured"]');
    return { button: !!li?.querySelector("button"), link: li?.querySelector("a[target=_blank]")?.getAttribute("href") };
  });
  await page.click("dialog[open] [data-slot='landing'] button");
  await page.waitForTimeout(800);
  const on = await page.evaluate(() => {
    const f = [...document.querySelectorAll("iframe")];
    return { count: f.length, sandbox: f[0]?.getAttribute("sandbox") ?? "", title: f[0]?.title ?? "", tab: !!document.querySelector("dialog[open] [data-slot='landing'] a[target=_blank]") };
  });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const off = await page.evaluate(() => document.querySelectorAll("iframe").length);
  check(before === 0 && on.count === 1 && !on.sandbox.includes("allow-same-origin") && on.title.includes("live demo") && on.tab && off === 0, `C7 embed only on request (${before} → ${on.count} → ${off} iframes), sandbox “${on.sandbox}”, new-tab link kept`);
  check(!linkOnly.button && linkOnly.link === "/qa/embed-fixture#pricing", `C7 embeddable:false slot offers only “Open in a new tab” (${linkOnly.link})`);
  // C11 six-card stack fits and stays compact
  const six = await page.evaluate((SEC) => ({ flow: document.querySelector(SEC).hasAttribute("data-flow") }), SEC);
  check(!six.flow, "C11 six-card fixture uses the stack at 1440×900");
  await ctx.close();
  for (const [q, expect] of [["?almanacFixture=1", 1], ["?almanacFixture=0", 0]]) {
    const { ctx: c2, page: p2 } = await openPage({}, q);
    await p2.waitForTimeout(400);
    const r = await p2.evaluate((SEC) => ({ n: document.querySelectorAll(`${SEC} ol > li`).length, h: document.querySelector(SEC).offsetHeight, vh: innerHeight }), SEC);
    check(r.n === expect && r.h < (expect ? 3.2 : 2.2) * r.vh, `C11 ${expect}-card configuration: ${r.n} cards, section ${r.h} px (${(r.h / r.vh).toFixed(2)} viewports)`);
    await c2.close();
  }
} else {
  skip("C7 live embed fixture and C11 card-count fixtures need next dev");
}

{
  // C8 reduced motion
  const { ctx, page } = await openPage({ reducedMotion: "reduce" });
  const r = await page.evaluate((SEC) => {
    const s = document.querySelector(SEC);
    return { flow: s.hasAttribute("data-flow"), transforms: [...s.querySelectorAll("[data-card]")].filter((c) => c.style.transform).length, sticky: [...s.querySelectorAll("ol > li")].filter((li) => getComputedStyle(li).position === "sticky").length };
  }, SEC);
  check(r.flow && r.transforms === 0 && r.sticky === 0, `C8 reduced motion: list layout, ${r.transforms} transforms, ${r.sticky} sticky cards`);
  await ctx.close();
}

{
  // C9 no pause control; a value left in sessionStorage by an earlier build does not switch the stack off
  const { ctx, page } = await openPage();
  await page.evaluate(() => sessionStorage.setItem("noir-motion-paused", "1"));
  await page.reload({ waitUntil: "load" });
  await page.waitForTimeout(800);
  const r = await page.evaluate((SEC) => ({ buttons: document.querySelectorAll(`${SEC} button[aria-pressed]`).length, flow: document.querySelector(SEC).hasAttribute("data-flow") }), SEC);
  check(r.buttons === 0 && !r.flow, `C9 no Pause control in the section (${r.buttons}); stale pause preference ignored (stack ${!r.flow})`);
  await ctx.close();
}

{
  // C16 glide after one wheel step, measured on the incoming second card mid-approach
  const { ctx, page } = await openPage();
  const y0 = await settleY(page, 0);
  const y1 = await settleY(page, 1);
  await scrollTo(page, Math.round(y0 + (y1 - y0) * 0.4));
  await frameSettle(page);
  await page.mouse.move(720, 450);
  const trace = page.evaluate((SEC) => new Promise((res) => {
    const li = document.querySelectorAll(`${SEC} ol > li`)[1];
    const card = li.querySelector("[data-card]");
    const out = [];
    const t0 = performance.now();
    const tick = () => {
      out.push(+(card.getBoundingClientRect().top - li.getBoundingClientRect().top).toFixed(2));
      if (performance.now() - t0 < 1500) requestAnimationFrame(tick);
      else res(out);
    };
    requestAnimationFrame(tick);
  }), SEC);
  await page.waitForTimeout(50);
  await page.mouse.wheel(0, 160);
  const d = await trace;
  const peak = Math.max(...d);
  const end = d[d.length - 1];
  const after = d.slice(d.indexOf(peak));
  const monotone = after.every((v, i) => i === 0 || v <= after[i - 1] + 0.5);
  check(peak > 8 && Math.abs(end) < 0.5 && Math.min(...d) > -0.5 && monotone, `C16 one 160 px wheel step: the incoming card trails by up to ${peak.toFixed(1)} px, eases back without overshoot, rests at ${end} px (${d.length} frames)`);
  await ctx.close();
}

{
  // C10 small screens and zoom
  for (const [w, h, dpr, label] of [[390, 844, 1, "phone 390×844"], [844, 390, 1, "landscape 844×390"], [720, 450, 2, "200 % zoom of 1440×900"], [320, 640, 1, "320×640"]]) {
    const { ctx, page } = await openPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
    await page.evaluate((SEC) => document.querySelector(SEC).scrollIntoView(), SEC);
    await page.waitForTimeout(300);
    const r = await page.evaluate((SEC) => {
      const s = document.querySelector(SEC);
      const plus = [...s.querySelectorAll("ol button")].map((b) => b.getBoundingClientRect());
      const clipped = [...s.querySelectorAll("[data-copy] p, [data-copy] h3")].some((e) => e.scrollHeight > e.clientHeight + 1 && getComputedStyle(e).overflow !== "visible");
      return { flow: s.hasAttribute("data-flow"), overflowX: document.documentElement.scrollWidth > innerWidth + 1, small: plus.filter((b) => b.width < 44 || b.height < 44).length, clipped };
    }, SEC);
    check(r.flow && !r.overflowX && r.small === 0 && !r.clipped, `C10 ${label}: list layout ${r.flow}, horizontal overflow ${r.overflowX}, controls < 44 px: ${r.small}, clipped text ${r.clipped}`);
    await ctx.close();
  }
}

{
  // C13 contrast
  const { ctx, page } = await openPage();
  const pairs = await page.evaluate((SEC) => {
    const s = document.querySelector(SEC);
    const parse = (c) => c.match(/[\d.]+/g).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
    const bgOf = (e) => { for (; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (!/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return parse(c); } return [255, 255, 255]; };
    const pick = { eyebrow: s.querySelector("header p"), lede: s.querySelectorAll("header p")[1], note: s.querySelector("[class*=note]"), meta: s.querySelector("[data-copy] p"), desc: s.querySelectorAll("[data-copy] p")[1], pill: s.querySelector("[data-copy] span") };
    return Object.fromEntries(Object.entries(pick).map(([k, e]) => [k, +ratio(parse(getComputedStyle(e).color), bgOf(e)).toFixed(2)]));
  }, SEC);
  check(Object.values(pairs).every((v) => v >= 4.5), `C13 contrast ${Object.entries(pairs).map(([k, v]) => `${k} ${v}`).join(", ")} (≥ 4.5)`);
  // the fixed header over the light section: muted nav link over the header glass composited on the section ground
  const headerAt = async (sel, p) => {
    await page.evaluate(([sel, p]) => { const t = document.querySelector(sel); const r = t.getBoundingClientRect(); scrollTo(0, Math.round(scrollY + r.top + p * Math.max(0, r.height - innerHeight))); }, [sel, p]);
    await page.waitForTimeout(500);
    return page.evaluate((SEC) => {
      const h = document.querySelector("header");
      const link = [...h.querySelectorAll("nav a")].find((a) => !a.getAttribute("aria-current"));
      const rgba = (c) => { const m = c.match(/[\d.]+/g).map(Number); return [m[0], m[1], m[2], m[3] ?? 1]; };
      const over = (top, under) => top.slice(0, 3).map((v, i) => v * top[3] + under[i] * (1 - top[3]));
      const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const ground = rgba(getComputedStyle(document.querySelector(SEC)).backgroundColor);
      const bg = over(rgba(getComputedStyle(h).backgroundColor), ground);
      const fg = over(rgba(getComputedStyle(link).color), bg);
      const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
      return { surface: h.dataset.surface ?? null, ratio: +((a + 0.05) / (b + 0.05)).toFixed(2) };
    }, SEC);
  };
  const onCards = await headerAt(SEC, 0.5);
  const onHero = await headerAt('section[aria-labelledby="noir-intro-title"]', 0.2);
  const onComplexity = await headerAt('section[aria-labelledby="noir-cinematic-title"]', 0.5);
  check(onCards.surface === "light" && onCards.ratio >= 4.5 && onHero.surface === null && onComplexity.surface === null, `C13 header over the cards: denser glass, muted nav link ${onCards.ratio} : 1; hero/Complexity keep the original header (${onHero.surface}, ${onComplexity.surface})`);
  await ctx.close();
}

{
  // C15 protected files
  const before = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/research/cards-almanac/implementation/protected-before.json"), "utf8"));
  // NoirIntro.tsx: the sitewide motion task (prompt/NOIR_SITEWIDE_AITHOR_MOTION_MASTER.md) routes its two CTAs
  // through TransitionLink. Undo exactly that rename and the file must still hash to the baseline.
  const normalise = (f, buf) =>
    f.path.endsWith("NoirIntro.tsx")
      ? Buffer.from(buf.toString("utf8").replace('import { TransitionLink } from "./motion/TransitionLink";', 'import Link from "next/link";').replace(/<TransitionLink/g, "<Link").replace(/<\/TransitionLink>/g, "</Link>"), "utf8")
      : buf;
  const changed = before.files.filter((f) => crypto.createHash("sha256").update(normalise(f, fs.readFileSync(path.join(ROOT, f.path)))).digest("hex") !== f.current);
  check(changed.length === 0, `C15 ${before.files.length} protected black-hole/intro/cinematic files unchanged since the implementation baseline${changed.length ? ": " + changed.map((f) => f.path).join(", ") : ""}`);
}

await browser.close();
console.log(notes.join("\n"));
if (failures.length) {
  console.error(`\n${failures.length} FAILED:\n` + failures.map((f) => "  ✗ " + f).join("\n"));
  process.exit(1);
}
console.log(`\nall ${notes.filter((n) => n.startsWith("ok")).length} checks passed`);
