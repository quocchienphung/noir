// Firefox smoke test against the local production build: per route, console errors, external requests,
// horizontal overflow, broken/upscaled images, document height vs Chrome-measured local height, and key CSS
// features (linear() easing on reveals, sizes max() picking large candidates).
import fs from "node:fs";
import { firefox } from "playwright";
const base = process.argv[2] || "http://127.0.0.1:3200";
const crawl = JSON.parse(fs.readFileSync("C:/Users/quocc/Downloads/norda/docs/research/norda-framer-website-3f1ea7cb/raw/crawl.json", "utf8"));
const chrome = JSON.parse(fs.readFileSync("C:/Users/quocc/Downloads/norda/docs/research/norda-framer-website-3f1ea7cb/qa/route-report.json", "utf8"));
const chromeRes = Array.isArray(chrome) ? chrome : chrome.results;
const browser = await firefox.launch();
const out = [];
for (const w of [1440, 390]) for (const c of crawl) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w >= 810 ? 900 : 844 } });
  const ext = [];
  await ctx.route("**/*", (r) => (new URL(r.request().url()).origin === new URL(base).origin ? r.continue() : (ext.push(r.request().url()), r.abort())));
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(String(e).slice(0, 160)));
  page.on("console", (m) => { if (m.type() === "error" && !m.text().includes("404")) errs.push(m.text().slice(0, 160)); });
  const resp = await page.goto(base + c.path, { waitUntil: "networkidle", timeout: 120000 });
  await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); await new Promise((r) => setTimeout(r, 400)); });
  await page.waitForLoadState("networkidle");
  const info = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll("img")].filter((i) => i.complete && i.naturalWidth && i.getBoundingClientRect().width > 100 && !/\.svg/.test(i.currentSrc));
    const up = imgs.filter((i) => { const b = i.getBoundingClientRect(); const s = getComputedStyle(i).objectFit === "cover" ? Math.max(b.width / i.naturalWidth, b.height / i.naturalHeight) : 1; return s > 1.15; }).length;
    const broken = [...document.querySelectorAll("img")].filter((i) => i.complete && i.naturalWidth === 0 && i.currentSrc).length;
    const c = document.querySelector("[data-nd-c]");
    return { h: document.documentElement.scrollHeight, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, up, broken, easing: c ? getComputedStyle(c).transitionTimingFunction.slice(0, 12) : "" };
  });
  const cr = chromeRes.find((x) => x.path === c.path && x.width === w);
  const row = { path: c.path, w, status: resp?.status(), errs: errs.length, ext: ext.length, ...info, dChrome: cr ? info.h - cr.height : null };
  out.push(row);
  const flag = row.errs || row.ext || row.overflow || row.broken || row.up || Math.abs(row.dChrome ?? 0) > 3;
  console.log(`${flag ? "!!" : "ok"} ${w} ${c.path.padEnd(52)} status ${row.status} h${row.h} Δchrome ${row.dChrome} errs ${row.errs} ext ${row.ext} overflow ${row.overflow} upscaled ${row.up} broken ${row.broken} ${row.easing}`);
  if (errs.length) console.log("   ", errs.slice(0, 2).join(" | "));
  await ctx.close();
}
fs.writeFileSync("firefox-report.json", JSON.stringify(out, null, 1));
await browser.close();
