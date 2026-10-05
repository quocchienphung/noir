// Hover the same control on both sites and save reference | local crops (after 700ms) into one strip.
import { chromium } from "playwright";
import { createRequire } from "node:module";
const sharp = createRequire("C:/Users/quocc/Downloads/norda/package.json")("sharp");
const items = [
  ["/about", "job row", '[data-framer-name="Job List"] a', "main ul a[href^='/jobs/']"],
  ["/", "footer link", '[data-framer-name="Footer"] a[href="./projects"]', "footer nav a[href='/projects']"],
  ["/", "subscribe", '[data-framer-name="Footer"] form button', "footer button[type=submit]"],
  ["/contact", "send", "form button", "main form button[type=submit]"],
  ["/", "hero arrow", 'button[aria-label="Next"]', 'button[aria-label="Next project"]'],
  ["/", "testi arrow", '[data-framer-name="Testimonials"] button[aria-label="Next"]', 'button[aria-label="Next testimonial"]'],
  ["/", "back to top", '[data-framer-name="Back To Top"]', "footer button:not([type=submit])"],
  ["/about", "team card", 'a[href*="team/erik"]', "#meet-the-team a[href*='erik']"],
];
const browser = await chromium.launch({ channel: "chrome" });
const tiles = [];
for (const [p, label, refSel, locSel] of items) {
  const pair = [];
  for (const [base, sel] of [["https://norda.framer.website", refSel], [process.env.LOCAL || "http://localhost:3000", locSel]]) {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    await page.goto(base + p, { waitUntil: "networkidle" });
    await page.waitForTimeout(3300);
    await page.evaluate(() => { for (const el of document.querySelectorAll("body *")) if (getComputedStyle(el).position === "fixed" && /Get this template|New Release/.test(el.textContent || "")) el.style.display = "none"; });
    const el = page.locator(sel).filter({ visible: true }).first();
    await el.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -150));
    await page.waitForTimeout(700);
    const b = await el.boundingBox();
    await page.mouse.move(b.x + b.width - 12, b.y + b.height / 2, { steps: 6 });
    await page.waitForTimeout(800);
    const cx = Math.min(1300, Math.max(0, b.x - 20)), cy = Math.min(840, Math.max(0, b.y - 20));
    const clip = { x: cx, y: cy, width: Math.min(700, b.width + 40, 1440 - cx), height: Math.min(500, b.height + 40, 900 - cy) };
    pair.push(await page.screenshot({ clip }));
    await page.context().close();
  }
  const [a, l] = await Promise.all(pair.map((buf) => sharp(buf).png().toBuffer({ resolveWithObject: true })));
  const w = a.info.width + l.info.width + 10, h = Math.max(a.info.height, l.info.height) + 24;
  tiles.push(await sharp({ create: { width: w, height: h, channels: 3, background: "#ff00ff" } })
    .composite([{ input: a.data, left: 0, top: 24 }, { input: l.data, left: a.info.width + 10, top: 24 },
      { input: Buffer.from(`<svg width="${w}" height="22"><text x="4" y="16" font-size="14" font-family="sans-serif" fill="white">${label} — reference | local</text></svg>`), left: 0, top: 0 }])
    .png().toBuffer());
  console.log("captured", label);
}
const metas = await Promise.all(tiles.map((t) => sharp(t).metadata()));
const W = Math.max(...metas.map((m) => m.width)), H = metas.reduce((s, m) => s + m.height + 8, 0);
let y = 0;
await sharp({ create: { width: W, height: H, channels: 3, background: "#333" } })
  .composite(tiles.map((t, i) => { const r = { input: t, left: 0, top: y }; y += metas[i].height + 8; return r; }))
  .png().toFile("hovercmp.png");
await browser.close();
