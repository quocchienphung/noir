// Imports TypeScript modules from src/ in plain Node for invariant tests: each file (and its relative
// imports) is transpiled with the repo's own `typescript` into a temp folder as .mjs. No bundler, no runtime
// changes; type-only imports are erased by the transpiler.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const out = fs.mkdtempSync(path.join(os.tmpdir(), "noir-ts-"));
const done = new Map();

function build(file) {
  if (done.has(file)) return done.get(file);
  const target = path.join(out, path.basename(file).replace(/\.tsx?$/, "") + "-" + done.size + ".mjs");
  done.set(file, target);
  let src = fs.readFileSync(file, "utf8");
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
  const rewritten = js.replace(/from\s+"(\.{1,2}\/[^"]+)"/g, (_, rel) => {
    const base = path.resolve(path.dirname(file), rel);
    const f = [".ts", ".tsx"].map((e) => base + e).find((p) => fs.existsSync(p));
    if (!f) throw new Error(`cannot resolve ${rel} from ${file}`);
    return `from "${pathToFileURL(build(f)).href}"`;
  });
  fs.writeFileSync(target, rewritten);
  return target;
}

export async function loadTs(file) {
  return import(pathToFileURL(build(path.resolve(file))).href);
}
