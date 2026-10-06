#!/usr/bin/env node
// QA tooling only: extracts stills from a recorded WebM by decoding it in Chrome (Playwright's bundled ffmpeg
// has no image output). Usage: node tests/lib/video-frames.mjs <video.webm> <outDir> <t1,t2,…> [width=640]
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const [video, outDir, times, w = "640"] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(w) } });
await page.goto(pathToFileURL(path.resolve(video)).href);
const name = path.basename(video, path.extname(video));
await page.addStyleTag({ content: "html,body{margin:0;background:#000}video{display:block;width:100vw;height:auto}" });
for (const t of times.split(",").map(Number)) {
  await page.evaluate(async (t) => {
    const v = document.querySelector("video");
    v.pause();
    v.controls = false;
    if (v.readyState < 1) await new Promise((r) => v.addEventListener("loadedmetadata", r, { once: true }));
    // Playwright WebMs may report Infinity duration until the end has been seeked once
    if (!Number.isFinite(v.duration)) {
      v.currentTime = 1e6;
      await new Promise((r) => v.addEventListener("seeked", r, { once: true }));
    }
    v.currentTime = Math.min(t, v.duration - 0.05);
    await new Promise((r) => v.addEventListener("seeked", r, { once: true }));
  }, t);
  await page.waitForTimeout(150);
  await page.locator("video").screenshot({ path: path.join(outDir, `${name}-t${String(t).padStart(5, "0")}.png`) });
}
await browser.close();
