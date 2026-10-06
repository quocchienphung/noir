#!/usr/bin/env node
// Pixel comparison of two capture folders from qa-spacetime-capture.mjs (same file names).
// Usage: node tests/qa-spacetime-diff.mjs <folderA> <folderB> [--max=0] [--only=prefix]
//   Reports mean |Δ| (0–255 per channel), max |Δ| and the fraction of differing pixels per frame. With
//   --max=N, exits 1 if any frame's max |Δ| exceeds N (N = 0 demands bit-identical renders).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const dir = (n) => path.join(ROOT, "docs/research/noir/spacetime-qa", n);
const [a, b] = process.argv.slice(2, 4);
const maxArg = process.argv.find((x) => x.startsWith("--max="));
const onlyArg = process.argv.find((x) => x.startsWith("--only="));
const limit = maxArg ? Number(maxArg.slice(6)) : null;
const only = onlyArg ? onlyArg.slice(7) : "";
let failed = false;
const rows = {};
for (const f of fs.readdirSync(dir(a)).filter((f) => f.endsWith(".png") && f.startsWith(only))) {
  const fb = path.join(dir(b), f);
  if (!fs.existsSync(fb)) continue;
  const A = await sharp(path.join(dir(a), f)).removeAlpha().raw().toBuffer();
  const B = await sharp(fb).removeAlpha().raw().toBuffer();
  let sum = 0, max = 0, px = 0;
  for (let i = 0; i < A.length; i += 3) {
    const d = Math.max(Math.abs(A[i] - B[i]), Math.abs(A[i + 1] - B[i + 1]), Math.abs(A[i + 2] - B[i + 2]));
    sum += Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]);
    if (d > max) max = d;
    if (d > 0) px++;
  }
  rows[f] = { meanAbs: +(sum / A.length).toFixed(4), max, changedPx: +(px / (A.length / 3)).toFixed(5) };
  if (limit !== null && max > limit) failed = true;
}
console.table(rows);
if (failed) {
  console.error(`FAIL: a frame differs by more than ${limit}`);
  process.exit(1);
}
