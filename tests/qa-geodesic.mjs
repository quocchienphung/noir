#!/usr/bin/env node
// Numerical check of the black-hole photon integrator (shader scheme ported in tests/lib/geodesic.mjs).
// Usage: node tests/qa-geodesic.mjs
// Invariants (Schwarzschild, rs = 1, camera at r = 20 and r = 11.6):
//  G1 the capture boundary (critical impact parameter) is within 0.5 % of 3√3/2 ≈ 2.5981;
//  G2 escaping rays' deflection matches a converged RK4 reference within 0.5° for b ∈ [2.75, 12];
//  G3 rays well outside the shadow (b ≥ 2.7) resolve (capture or escape) within the step budget;
//  G4 rays well inside (b ≤ 2.45) are captured.
// The previous semi-implicit Euler scheme is reported alongside for the record (not asserted).
import { VERLET, criticalB, deflection, rayAt, traceEuler, traceReference, traceVerlet } from "./lib/geodesic.mjs";

const BC = (3 * Math.sqrt(3)) / 2;
const failures = [];
const rows = [];

for (const d of [20, 11.6]) {
  const bV = criticalB((p, v) => traceVerlet(p, v), d);
  const bE = criticalB((p, v) => traceEuler(p, v), d);
  rows.push(`d=${d}: critical b  Verlet ${bV.toFixed(4)} (${(((bV - BC) / BC) * 100).toFixed(2)} %)   old Euler ${bE.toFixed(4)} (${(((bE - BC) / BC) * 100).toFixed(2)} %)   exact ${BC.toFixed(4)}`);
  if (Math.abs(bV - BC) / BC > 0.005) failures.push(`G1 d=${d}: critical b ${bV.toFixed(4)} vs ${BC.toFixed(4)}`);

  let worstV = 0, worstE = 0, maxSteps = 0;
  for (const b of [2.75, 2.9, 3.2, 3.6, 4.5, 6, 8, 12]) {
    const [p, v] = rayAt(b, d);
    const ref = traceReference(p, v);
    const rv = traceVerlet(p, v);
    const re = traceEuler(p, v);
    if (ref.state !== "escaped") continue;
    if (rv.state === "unresolved") failures.push(`G3 d=${d} b=${b}: unresolved after ${VERLET.steps} steps`);
    if (rv.state !== "escaped") {
      failures.push(`G2 d=${d} b=${b}: Verlet ${rv.state}, reference escaped`);
      continue;
    }
    const dv = Math.abs(deflection(rv) - deflection(ref));
    const de = re.state === "escaped" ? Math.abs(deflection(re) - deflection(ref)) : Infinity;
    worstV = Math.max(worstV, dv);
    worstE = Math.max(worstE, de);
    maxSteps = Math.max(maxSteps, rv.steps);
    if (dv > 0.5) failures.push(`G2 d=${d} b=${b}: deflection error ${dv.toFixed(3)}°`);
  }
  rows.push(`d=${d}: worst deflection error  Verlet ${worstV.toFixed(3)}°  old Euler ${worstE.toFixed(3)}°   max steps used ${maxSteps}/${VERLET.steps}`);
  for (const b of [1.5, 2.2, 2.45]) {
    const [p, v] = rayAt(b, d);
    const rv = traceVerlet(p, v);
    if (rv.state !== "captured") failures.push(`G4 d=${d} b=${b}: ${rv.state}`);
  }
}

console.log(rows.join("\n"));
if (failures.length) {
  console.log(`FAIL (${failures.length})\n` + failures.join("\n"));
  process.exit(1);
}
console.log("PASS");
