#!/usr/bin/env node
// One deterministic capture of a dev URL (iteration helper for the Spacetime Journey work).
// Usage: node tests/qa-spacetime-shot.mjs <out.png> <pathAndQuery> [width=1280] [height=720] [baseUrl=http://localhost:3000]
// Waits for the first canvas to be ready (if any), hides the Next dev overlay, then screenshots the viewport.
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const [out, url, w = "1280", h = "720", base = "http://localhost:3000"] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome", args: ["--enable-gpu", "--ignore-gpu-blocklist", "--use-angle=d3d11"] });
const page = await (await browser.newContext({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1 })).newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.goto(base + url, { waitUntil: "load" });
await page.waitForFunction(() => [...document.querySelectorAll("canvas")].some((c) => c.dataset.ready !== undefined), null, { timeout: 30000 }).catch(() => {});
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await page.waitForTimeout(900);
fs.mkdirSync(path.dirname(out), { recursive: true });
await page.screenshot({ path: out });
if (errors.length) console.log(errors.join("\n"));
await browser.close();
