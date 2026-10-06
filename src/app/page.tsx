import { NoirCardsAlmanac } from "@/components/noir/NoirCardsAlmanac";
import { NoirCinematic } from "@/components/noir/NoirCinematic";
import { NoirIntro } from "@/components/noir/NoirIntro";
import { NoirPrinciples, NoirProcess, NoirServices } from "@/components/noir/sections";

// `/`: scroll-driven dive → Cards Almanac (capabilities + the project card stack) → black-hole cinematic
// frame → services → process → principles.
// The footer (in the shell) carries the closing call to action.
export default function HomePage() {
  return (
    <main>
      <NoirIntro />
      <NoirCardsAlmanac />
      <NoirCinematic />
      <NoirServices />
      <NoirProcess />
      <NoirPrinciples />
    </main>
  );
}
