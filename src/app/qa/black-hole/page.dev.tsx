import type { Metadata } from "next";
import { BlackHoleQa } from "@/components/noir/BlackHoleQa";

// Development-only black-hole QA harness (routed only under `next dev`, see next.config.ts).
// /qa/black-hole?scene=reference|dive|cinematic&p=0.5&bhT=12&bhQ=ultra&bhScale=1&bhDebug=2&bhView=2&bhGrain=0
export const metadata: Metadata = { title: "Black hole QA", robots: { index: false } };

export default function BlackHoleQaPage() {
  return <BlackHoleQa />;
}
