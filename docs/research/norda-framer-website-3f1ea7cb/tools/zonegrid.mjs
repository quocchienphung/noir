// Samples a grid of viewport points at several scroll positions on reference and local, resolves the cursor
// zone at each point (reference: nearest data-framer-cursor id → variant; local: nearest data-cursor) and
// reports disagreements with the elements hit.
import fs from "node:fs";
import { chromium } from "playwright";
const NAMES = {
  "128ypj7": "dot", "1a6uo53": "dot-white", "5xjkw5": "none", okwo4e: "none", "1h57xtr": "view-project", afsa3o: "read-article", my4b76: "none",
  "6ovrk1": "award-1", "196sg7v": "award-2", "1mw1qt4": "award-3", "1p2iufc": "award-4", bebyub: "award-5", "15l5yc0": "award-6", "1jdy3f2": "award-7", "1ffvi1o": "award-8",
};
const routes = (process.argv[2] || "/").split(",");
const w = +(process.argv[3] || 1440);
const local = process.env.LOCAL || "http://localhost:3000";
const XS = [40, 120, 300, 480, 720, 960, 1140, 1300, 1400].filter((x) => x < w);
const YS = [60, 160, 300, 450, 600, 750, 860];
const browser = await chromium.launch({ channel: "chrome" });
const summary = [];
for (const p of routes) {
  const pages = {};
  for (const [k, base] of [["ref", "https://norda.framer.website"], ["loc", local]]) {
    const page = await (await browser.newContext({ viewport: { width: w, height: 900 } })).newPage();
    await page.goto(base + p, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(3300);
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("body *")) if (getComputedStyle(el).position === "fixed" && /Get this template|New Release/.test(el.textContent || "")) el.style.display = "none";
      const badge = document.getElementById("__framer-badge-container"); if (badge) badge.style.display = "none";
    });
    pages[k] = page;
  }
  const total = await pages.loc.evaluate(() => document.documentElement.scrollHeight);
  let n = 0, bad = 0; const examples = [];
  for (let y = 0; y < total - 200; y += 700) {
    for (const k of ["ref", "loc"]) { await pages[k].evaluate((y) => window.scrollTo(0, y), y); }
    await pages.ref.waitForTimeout(700); await pages.loc.waitForTimeout(300);
    const pts = XS.flatMap((x) => YS.map((yy) => [x, yy]));
    const ref = await pages.ref.evaluate(([pts, NAMES]) => pts.map(([x, y]) => { const e = document.elementFromPoint(x, y); const c = e?.closest("[data-framer-cursor]"); const id = c?.getAttribute("data-framer-cursor") || "okwo4e"; let nm = "", q = e; while (q && !nm) { nm = q.getAttribute?.("data-framer-name") || ""; q = q.parentElement; } return [NAMES[id] || id, `${e?.tagName?.toLowerCase()}[${nm}] "${(e?.textContent || "").trim().slice(0, 18)}"`]; }), [pts, NAMES]);
    const loc = await pages.loc.evaluate((pts) => pts.map(([x, y]) => { const e = document.elementFromPoint(x, y); let v = ""; for (let n = e?.closest("[data-cursor]"); n; n = n.parentElement?.closest("[data-cursor]")) { if (window.innerWidth >= Number(n.dataset.cursorMin ?? 0)) { v = n.dataset.cursor || ""; break; } } return [v || "none", `${e?.tagName?.toLowerCase()}.${String(e?.className?.baseVal ?? e?.className ?? "").split("__")[1]?.slice(0, 14) || ""} "${(e?.textContent || "").trim().slice(0, 18)}"`]; }), pts);
    pts.forEach(([x, yy], i) => { n++; if (ref[i][0] !== loc[i][0]) { bad++; examples.push(`y${y + yy} x${x}: ref ${ref[i][0]} ${ref[i][1]} | loc ${loc[i][0]} ${loc[i][1]}`); } });
  }
  for (const k of ["ref", "loc"]) await pages[k].context().close();
  summary.push({ route: p, width: w, points: n, mismatches: bad, examples });
  console.log(`== ${p} @${w}: ${bad}/${n} mismatched`);
  for (const e of examples) console.log("   " + e);
}
fs.writeFileSync(process.env.OUT || `zonegrid-${w}.json`, JSON.stringify(summary, null, 1));
await browser.close();
