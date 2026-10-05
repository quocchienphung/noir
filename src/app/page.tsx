import { NoirCinematic } from "@/components/noir/NoirCinematic";
import { NoirIntro } from "@/components/noir/NoirIntro";
import { NoirCapabilities, NoirPrinciples, NoirProcess, NoirServices } from "@/components/noir/sections";

// `/`: scroll-driven dive → capabilities → black-hole cinematic frame → services → process → principles.
// The footer (in the shell) carries the closing call to action.
export default function HomePage() {
  return (
    <main>
      <NoirIntro />
      <NoirCapabilities />
      <NoirCinematic />
      <NoirServices />
      <NoirProcess />
      <NoirPrinciples />
    </main>
  );
}
