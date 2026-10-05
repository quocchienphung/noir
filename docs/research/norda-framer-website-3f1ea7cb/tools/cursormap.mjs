// For each Framer cursor id: hover a few visible elements whose nearest data-framer-cursor ancestor has that id
// and record what the follower paints (size, background, text) plus where the element sits.
import { chromium } from "playwright";
const routes = (process.argv[2] || "/,/projects,/news,/about,/contact,/team/erik-lindholm,/jobs/3d-artist,/404").split(",");
const browser = await chromium.launch({ channel: "chrome" });
const result = {};
for (const p of routes) {
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto("https://norda.framer.website" + p, { waitUntil: "networkidle" });
  await page.waitForTimeout(3300);
  // hide promo so it never sits under the pointer
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("body *")) if (getComputedStyle(el).position === "fixed" && /Get this template|New Release/.test(el.textContent || "")) el.style.display = "none";
  });
  const ids = await page.evaluate(() => [...new Set([...document.querySelectorAll("[data-framer-cursor]")].map((e) => e.getAttribute("data-framer-cursor")))]);
  for (const id of ids) {
    // candidates: leaf-ish visible elements whose closest cursor ancestor is id
    const cands = await page.evaluate((id) => {
      const out = [];
      for (const el of document.querySelectorAll("a, button, p, h1, h2, h3, img, input, label, div")) {
        if (!el.checkVisibility()) continue;
        const c = el.closest("[data-framer-cursor]");
        if (!c || c.getAttribute("data-framer-cursor") !== id) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 30 || r.height < 14 || r.width > 1500) continue;
        let sec = el, name = "";
        while (sec && !name) { name = sec.getAttribute?.("data-framer-name") || ""; sec = sec.parentElement; }
        out.push({ y: r.top + scrollY + Math.min(r.height / 2, 20), x: r.left + Math.min(r.width / 2, 60), what: `${el.tagName}[${name}] "${(el.textContent || "").trim().slice(0, 24)}"` });
        if (out.length > 60) break;
      }
      return out.filter((_, i, a) => i % Math.max(1, Math.floor(a.length / 3)) === 0).slice(0, 3);
    }, id);
    for (const c of cands) {
      await page.evaluate((y) => window.scrollTo(0, y - 450), c.y);
      await page.waitForTimeout(400);
      const sy = await page.evaluate(() => window.scrollY);
      await page.mouse.move(2, 2);
      await page.mouse.move(c.x, c.y - sy, { steps: 5 });
      await page.waitForTimeout(500);
      const painted = await page.evaluate(([x, y]) => {
        const hits = [...document.querySelectorAll("body *")].filter((e) => {
          const r = e.getBoundingClientRect();
          if (r.width < 8 || r.width > 300 || r.height < 8 || r.height > 400) return false;
          if (Math.abs(r.left - x) > 160 || Math.abs(r.top + r.height / 2 - y) > 200) return false;
          let f = e, fixed = false;
          while (f) { if (getComputedStyle(f).position === "fixed") { fixed = true; break; } f = f.parentElement; }
          if (!fixed || !e.checkVisibility({ opacityProperty: true })) return false;
          const cs = getComputedStyle(e);
          return (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && e.children.length === 0) || e.tagName === "IMG" || (e.children.length === 0 && /VIEW|READ/.test(e.textContent));
        });
        return hits.slice(0, 2).map((e) => { const r = e.getBoundingClientRect(); return `${e.tagName} ${Math.round(r.width)}x${Math.round(r.height)} bg ${getComputedStyle(e).backgroundColor} ${(e.textContent || "").trim().slice(0, 14)}`; }).join(" ; ") || "nothing";
      }, [c.x, c.y - sy]);
      (result[id] ||= []).push(`${p} ${c.what} → ${painted}`);
    }
  }
  await page.context().close();
}
for (const [id, rows] of Object.entries(result)) {
  console.log("==", id);
  for (const r of rows.slice(0, 8)) console.log("   ", r);
}
await browser.close();
