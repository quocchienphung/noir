import { cn } from "@/lib/utils";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/ticker.module.css";

/**
 * Time-driven marquee ("Nordå Architects ~"). MEASURED: ≈101 px/s leftwards, seamless loop, 200px band.
 * Decorative: hidden from assistive technology.
 */
export function Ticker({ text, className }: { text: string; className?: string }) {
  return (
    <div className={cn(s.ticker, className)} aria-hidden="true">
      <div className={s.track}>
        {[0, 1, 2, 3].map((k) => (
          <span key={k} className={cn(site.display, s.item)}>
            {`${text} `}
          </span>
        ))}
      </div>
    </div>
  );
}
