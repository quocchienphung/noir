#!/usr/bin/env node
// Behaviour QA for the Nordå reconstruction.
// Usage: node tests/qa-behaviors.mjs [baseUrl=http://localhost:3200]
// Every browser context aborts requests that leave the local origin and records any POST, so the
// assertions double as an independence check (no source endpoints, no form submissions).
// Writes docs/research/<site>/qa/behavior-report.json and exits non-zero when a check fails.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const SITE = "norda-framer-website-3f1ea7cb";
const base = process.argv[2] || "http://localhost:3200";
const origin = new URL(base).origin;

const browser = await chromium.launch({ channel: "chrome" });
const results = [];
const external = new Set();
const posts = [];

async function context(width, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: width >= 810 ? 900 : 844 }, serviceWorkers: "block", ...extra });
  await ctx.route("**/*", (r) => {
    const req = r.request();
    const u = new URL(req.url());
    if (req.method() === "POST") posts.push(req.url());
    if (u.origin === origin || u.protocol === "data:" || u.protocol === "blob:") return r.continue();
    external.add(req.url());
    return r.abort();
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
  page.on("console", (m) => {
    if (m.type() === "error" && !m.text().includes("status of 404")) errors.push(m.text().slice(0, 300));
  });
  return { ctx, page, errors };
}

async function check(name, width, fn, extra) {
  const { ctx, page, errors } = await context(width, extra);
  let ok = false;
  let detail = "";
  try {
    detail = (await fn(page)) ?? "";
    ok = errors.length === 0;
    if (!ok) detail += ` | console: ${errors.join(" ; ")}`;
  } catch (e) {
    detail = String(e.message || e).split("\n")[0].slice(0, 400);
  }
  results.push({ name, width, ok, detail });
  process.stdout.write(`${ok ? "PASS" : "FAIL"} ${String(width).padEnd(5)} ${name}${detail ? ` — ${detail}` : ""}\n`);
  await ctx.close();
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const open = async (page, p) => {
  const resp = await page.goto(base + p, { waitUntil: "networkidle", timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  return resp;
};
const wait = (page, ms) => page.waitForTimeout(ms);

// ---------- Menu drawer ----------
for (const w of [1440, 390]) {
  await check("menu: open, focus trap, Escape closes and returns focus", w, async (page) => {
    await open(page, "/projects");
    const button = page.locator('button[aria-controls="nd-menu"]');
    await button.click();
    await wait(page, 900);
    assert((await button.getAttribute("aria-expanded")) === "true", "aria-expanded not true");
    assert((await page.locator("#nd-menu").getAttribute("data-open")) !== null, "drawer not open");
    const locked = await page.evaluate(() => getComputedStyle(document.documentElement).overflow);
    assert(locked === "hidden", `scroll not locked (${locked})`);
    for (let i = 0; i < 12; i++) await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
    assert(inside, "focus escaped the dialog");
    await page.keyboard.press("Escape");
    await wait(page, 900);
    assert((await button.getAttribute("aria-expanded")) === "false", "Escape did not close");
    const focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-controls"));
    assert(focused === "nd-menu", "focus not returned to MENU");
    return "ok";
  });
  await check("menu: link navigates and drawer closes", w, async (page) => {
    await open(page, "/");
    await page.locator('button[aria-controls="nd-menu"]').click();
    await wait(page, 900);
    await page.locator('#nd-menu a[href="/news"]').click();
    await page.waitForURL(base + "/news");
    await wait(page, 900);
    assert((await page.locator('button[aria-controls="nd-menu"]').getAttribute("aria-expanded")) === "false", "drawer still open");
    assert(await page.locator("#main-container").count(), "news content not rendered");
    return page.url().replace(origin, "");
  });
}

// ---------- Home hero carousel ----------
await check("hero: next / previous / wrap-around", 1440, async (page) => {
  await open(page, "/");
  const dots = page.locator('[aria-label="Choose project"] button');
  const active = async () => (await dots.evaluateAll((b) => b.findIndex((x) => x.getAttribute("aria-pressed") === "true")));
  const count = await dots.count();
  assert((await active()) === 0, "initial slide not 0");
  await page.locator('button[aria-label="Next project"]').click();
  await wait(page, 1400);
  assert((await active()) === 1, "next did not advance");
  await page.locator('button[aria-label="Previous project"]').click();
  await wait(page, 1400);
  await page.locator('button[aria-label="Previous project"]').click();
  await wait(page, 1400);
  assert((await active()) === count - 1, "previous did not wrap to last");
  await page.locator('button[aria-label="Next project"]').click();
  await wait(page, 1400);
  assert((await active()) === 0, "next did not wrap to first");
  return `${count} slides`;
});
await check("hero: dots + swipe on phone", 390, async (page) => {
  await open(page, "/");
  const dots = page.locator('[aria-label="Choose project"] button');
  const active = async () => (await dots.evaluateAll((b) => b.findIndex((x) => x.getAttribute("aria-pressed") === "true")));
  await dots.nth(2).click();
  await wait(page, 1400);
  assert((await active()) === 2, "dot 3 not active");
  // Swipes are touch/pen only (mouse drags are ignored), so dispatch touch pointer events.
  await page.evaluate(() => {
    const el = document.querySelector('[aria-label="Featured projects"] ul');
    const r = el.getBoundingClientRect();
    const y = r.top + r.height / 2;
    const ev = (type, x) => new PointerEvent(type, { bubbles: true, pointerType: "touch", pointerId: 7, isPrimary: true, clientX: x, clientY: y });
    el.dispatchEvent(ev("pointerdown", 300));
    el.dispatchEvent(ev("pointermove", 200));
    el.dispatchEvent(ev("pointerup", 80));
  });
  await wait(page, 1400);
  const count = await dots.count();
  assert((await active()) === (2 + 1) % count, `swipe left did not advance (active ${await active()})`);
  return "ok";
});

// ---------- Services accordion ----------
await check("services accordion: toggle items independently", 1440, async (page) => {
  await open(page, "/");
  const triggers = page.locator('li[data-cursor="dot"] button[aria-expanded]');
  const first = triggers.nth(0);
  await first.scrollIntoViewIfNeeded();
  const before = await first.getAttribute("aria-expanded");
  await first.click();
  await wait(page, 700);
  const after = await first.getAttribute("aria-expanded");
  assert(before !== after, "aria-expanded did not change");
  const panelId = await first.getAttribute("aria-controls");
  const inert = await page.locator(`#${panelId}`).evaluate((el) => el.inert);
  assert(inert === (after === "false"), "panel inert state out of sync");
  await triggers.nth(1).click();
  await wait(page, 700);
  assert((await first.getAttribute("aria-expanded")) === after, "opening another item changed the first");
  return `first ${before}→${after}`;
});

// ---------- Testimonials ----------
await check("testimonials: next / previous", 1440, async (page) => {
  await open(page, "/");
  const live = page.locator('[aria-label="Testimonials"] [aria-live="polite"]');
  await page.locator('button[aria-label="Next testimonial"]').scrollIntoViewIfNeeded();
  await page.locator('button[aria-label="Next testimonial"]').click();
  await wait(page, 1400);
  const t1 = await live.textContent();
  assert(t1?.startsWith("Testimonial 2"), `after next: ${t1}`);
  await page.locator('button[aria-label="Previous testimonial"]').click();
  await wait(page, 1400);
  const t0 = await live.textContent();
  assert(t0?.startsWith("Testimonial 1"), `after previous: ${t0}`);
  return t1;
});

// ---------- Forms (local demo only) ----------
await check("newsletter: validation + local demo confirmation", 1440, async (page) => {
  await open(page, "/contact");
  const form = page.locator("footer form");
  const input = form.locator('input[name="email"]');
  await input.scrollIntoViewIfNeeded();
  await form.locator('button[type="submit"]').click();
  assert((await input.getAttribute("aria-invalid")) === "true", "empty email accepted");
  await input.fill("not-an-email");
  await form.locator('button[type="submit"]').click();
  assert((await input.getAttribute("aria-invalid")) === "true", "invalid email accepted");
  await input.fill("person@example.com");
  await form.locator('button[type="submit"]').click();
  const status = await page.locator("footer [role=status]").first().textContent();
  assert(status?.includes("Demo only"), `no demo notice (${status})`);
  return status;
});
await check("contact form: required fields + local demo confirmation", 1440, async (page) => {
  await open(page, "/contact");
  const form = page.locator("main form");
  await form.locator('button[type="submit"]').click();
  const invalid = await form.locator('[aria-invalid="true"]').count();
  assert(invalid === 4, `expected 4 invalid fields, got ${invalid}`);
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("name"));
  assert(focused === "name", `first invalid field not focused (${focused})`);
  await form.locator('[name="name"]').fill("Test Person");
  await form.locator('[name="email"]').fill("person@example.com");
  await form.locator('[name="phone"]').fill("+46 000 000");
  await form.locator('[name="message"]').fill("Hello");
  await form.locator('button[type="submit"]').click();
  const status = await page.locator("#nd-contact-status").textContent();
  assert(status?.includes("Demo only"), `no demo notice (${status})`);
  return status;
});

// ---------- Footer back to top ----------
await check("footer: back to top", 1440, async (page) => {
  await open(page, "/privacy-policy");
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await wait(page, 600);
  await page.getByRole("button", { name: "BACK TO TOP" }).click();
  await page.waitForFunction(() => window.scrollY < 2, null, { timeout: 8000 });
  return "scrollY 0";
});

// ---------- Links, history, deep links ----------
await check("links: internal navigation + back / forward", 1440, async (page) => {
  await open(page, "/");
  await page.locator('main a[href="/about"]').first().click();
  await page.waitForURL(base + "/about");
  await page.goBack();
  await page.waitForURL(base + "/");
  await page.goForward();
  await page.waitForURL(base + "/about");
  return "/ → /about → / → /about";
});
for (const [p, id] of [
  ["/about#job-openings", "job-openings"],
  ["/about#meet-the-team", "meet-the-team"],
  ["/news#main-container", "main-container"],
  ["/team/erik-lindholm#main-container", "main-container"],
]) {
  await check(`deep link ${p}`, 1440, async (page) => {
    await open(page, p);
    await wait(page, 800);
    const top = await page.evaluate((id) => Math.round(document.getElementById(id)?.getBoundingClientRect().top ?? NaN), id);
    assert(Number.isFinite(top) && Math.abs(top) <= 2, `#${id} top at ${top}px`);
    return `#${id} top ${top}px`;
  });
}
await check("project detail: next-project link", 1440, async (page) => {
  await open(page, "/projects/verve-tower");
  const next = page.locator('main a[href^="/projects/"]').last();
  const href = await next.getAttribute("href");
  await next.click();
  await page.waitForURL(base + href);
  return href;
});

// ---------- Not found ----------
for (const p of ["/projects/unknown-slug", "/team/unknown", "/jobs/unknown", "/news/unknown", "/not-a-page", "/404"]) {
  await check(`404 for ${p}`, 1440, async (page) => {
    const resp = await open(page, p);
    assert(resp?.status() === 404, `status ${resp?.status()}`);
    const text = await page.locator("main").innerText();
    assert(/404|not found|doesn.t exist/i.test(text), "404 content missing");
    return "404";
  });
}

// ---------- Cursor follower (fine pointer) ----------
// MEASURED cursor zones (Framer data-framer-cursor map): page default black dot, white dot in the footer,
// none over chrome/footer controls, labels over project cards.
await check("cursor follower zones", 1440, async (page) => {
  await open(page, "/projects");
  const variant = () => page.locator('[data-variant][aria-hidden="true"]').first().getAttribute("data-variant");
  const hover = async (selector) => {
    const el = page.locator(selector).filter({ visible: true }).first();
    await el.scrollIntoViewIfNeeded();
    await wait(page, 500);
    const b = await el.boundingBox();
    await page.mouse.move(b.x + Math.min(b.width / 2, 40), b.y + Math.min(b.height / 2, 20), { steps: 4 });
    await wait(page, 300);
    return variant();
  };
  const expectations = [
    ['[data-cursor="view-project"]', "view-project"],
    ['button[aria-controls="nd-menu"]', "none"],
    ["main p", "dot"],
    ["footer h2", "dot-white"],
    ["footer nav a", "none"],
  ];
  const seen = [];
  for (const [selector, want] of expectations) {
    const got = await hover(selector);
    assert(got === want, `${selector}: ${got} (want ${want})`);
    seen.push(got);
  }
  return seen.join(", ");
});

// ---------- Keyboard ----------
await check("services accordion: keyboard Enter / Space", 1440, async (page) => {
  await open(page, "/");
  const trigger = page.locator('li[data-cursor="dot"] button[aria-expanded]').nth(2);
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  const before = await trigger.getAttribute("aria-expanded");
  await page.keyboard.press("Enter");
  await wait(page, 600);
  const afterEnter = await trigger.getAttribute("aria-expanded");
  await page.keyboard.press("Space");
  await wait(page, 600);
  const afterSpace = await trigger.getAttribute("aria-expanded");
  assert(before !== afterEnter && afterSpace === before, `${before} → ${afterEnter} → ${afterSpace}`);
  return `${before} → ${afterEnter} → ${afterSpace}`;
});

// ---------- Character reveals ----------
const revealOpacity = (page, sel) =>
  page.evaluate((sel) => {
    const chars = [...document.querySelectorAll(`${sel} [data-nd-c]`)];
    return chars.length ? chars.reduce((a, c) => a + Number(getComputedStyle(c).opacity), 0) / chars.length : -1;
  }, sel);
await check("char reveal: job title rises after load (desktop)", 1440, async (page) => {
  await open(page, "/jobs/3d-artist");
  const early = await revealOpacity(page, "h1");
  await wait(page, 2600);
  const late = await revealOpacity(page, "h1");
  assert(late > 0.99, `title opacity ${late.toFixed(2)} after 2.6s`);
  return `opacity ${early.toFixed(2)} → ${late.toFixed(2)}`;
});
await check("char reveal: plain title on tablet", 1024, async (page) => {
  await open(page, "/jobs/3d-artist");
  const o = await revealOpacity(page, "h1");
  assert(o === 1, `tablet title opacity ${o}`);
  return "static";
});
await check("char reveal: home intro plays on entering the viewport", 1440, async (page) => {
  await open(page, "/");
  const sel = '[data-nd-reveal]';
  const before = await revealOpacity(page, sel);
  await page.locator(sel).first().scrollIntoViewIfNeeded();
  await wait(page, 1600);
  const after = await page.evaluate(() => {
    const chars = [...document.querySelectorAll("[data-nd-reveal]")][0].querySelectorAll("[data-nd-c]");
    return [...chars].every((c) => Number(getComputedStyle(c).opacity) > 0.99);
  });
  assert(before < 0.01 && after, `before ${before.toFixed(2)}, all visible after: ${after}`);
  return "hidden → visible";
});

// ---------- Reduced motion ----------
await check("reduced motion: counters final, reveals static", 1440, async (page) => {
  await open(page, "/");
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
    }
  });
  await wait(page, 500);
  const values = await page.evaluate(() => [...document.querySelectorAll("[style*='--nd-counter-p']")].map((e) => e.style.getPropertyValue("--nd-counter-p")));
  assert(values.length > 0 && values.every((v) => v === "1.0000"), `counter progress ${values.join(",")}`);
  await page.evaluate(() => window.scrollTo(0, 0));
  const reveal = await revealOpacity(page, "[data-nd-reveal]");
  assert(reveal === 1, `character reveals not static (${reveal})`);
  return `counters ${values.join(",")}, reveals static`;
}, { reducedMotion: "reduce" });

await browser.close();

const failed = results.filter((r) => !r.ok);
const report = {
  base,
  generatedAt: new Date().toISOString(),
  passed: results.length - failed.length,
  failed: failed.length,
  externalRequestsBlocked: [...external],
  postRequests: posts,
  results,
};
const out = path.join(ROOT, "docs/research", SITE, "qa/behavior-report.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, null, 2));
console.log(`\n${report.passed}/${results.length} passed · external requests: ${external.size} · POST requests: ${posts.length}`);
if (failed.length || external.size || posts.length) process.exitCode = 1;
