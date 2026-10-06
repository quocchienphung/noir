import type { Metadata } from "next";

// Development-only local page for the Cards Almanac live-demo hook (routed only under `next dev`). It is a test
// page, not a demo of anyone's project; tests/qa-cards-almanac.mjs embeds it to prove the embed lifecycle.
export const metadata: Metadata = { title: "Embed fixture", robots: { index: false } };

export default function EmbedFixturePage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui", color: "#f4f1ea", background: "#111", minHeight: "100vh" }}>
      <h1 id="fixture">Local embed fixture</h1>
      <p>Test page for the Cards Almanac live-demo slot. Not a project demo.</p>
      <p id="pricing">Section anchor target.</p>
    </main>
  );
}
