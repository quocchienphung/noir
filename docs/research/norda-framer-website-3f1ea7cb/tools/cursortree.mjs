// Prints, for a reference route, the elements where the effective cursor changes (nearest data-framer-cursor
// ancestor differs from the parent's), with section names and geometry — the visible cursor regions.
import { chromium } from "playwright";
const NAMES = { "128ypj7": "Black", "1a6uo53": "White", "5xjkw5": "None", okwo4e: "None(default)", "1h57xtr": "View Project", afsa3o: "Read Article", my4b76: "None" };
const routes = (process.argv[2] || "/").split(",");
const w = +(process.argv[3] || 1440);
const browser = await chromium.launch({ channel: "chrome" });
for (const p of routes) {
  const page = await (await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 } })).newPage();
  await page.goto("https://norda.framer.website" + p, { waitUntil: "networkidle" });
  const rows = await page.evaluate((NAMES) => {
    const out = [];
    const eff = (el) => el.closest("[data-framer-cursor]")?.getAttribute("data-framer-cursor") || "okwo4e";
    for (const el of document.querySelectorAll("[data-framer-cursor]")) {
      if (!el.checkVisibility()) continue;
      const id = el.getAttribute("data-framer-cursor");
      const parentId = el.parentElement ? eff(el.parentElement) : "okwo4e";
      if (parentId === id) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      let n = el, name = "";
      for (let i = 0; i < 4 && n; i++, n = n.parentElement) { const nm = n.getAttribute?.("data-framer-name"); if (nm) { name = name ? name : nm; } }
      let depth = 0; for (let a = el.parentElement; a; a = a.parentElement) if (a.hasAttribute?.("data-framer-cursor")) depth++;
      out.push(`${"  ".repeat(depth)}${NAMES[id] || id} [${el.tagName.toLowerCase()} ${name}] y${Math.round(r.top + scrollY)} x${Math.round(r.left)} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 30)}"`);
    }
    return out;
  }, NAMES);
  console.log(`##### ${p} @${w}`);
  const seen = new Set();
  for (const r of rows) { const k = r.replace(/ y\d+/, ""); if (seen.has(k)) continue; seen.add(k); console.log(r); }
  await page.context().close();
}
await browser.close();
