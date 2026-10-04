import { cn } from "@/lib/utils";
import { InView } from "./InView";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/record-list.module.css";

export interface RecordRow {
  title: string;
  meta: string;
  year: string;
  /** Optional cursor-follower variant (e.g. "award-3"). */
  cursor?: string;
}

/**
 * Titled "/ N" list with hairline rows (Awards, Archive Projects, Publications).
 * Source rows link to an external template-marketplace URL; here they are inert list items.
 * MEASURED in-view effects (desktop): title y 30 → 0; list y 100 → 0 + opacity, replaying on re-entry.
 */
export function RecordList({
  title,
  rows,
  id,
  tone = "dark",
  className,
  showCount = true,
  appear = "list",
  thickLines = false,
  titleAppear = true,
  variant = "default",
}: {
  title: string;
  rows: RecordRow[];
  id: string;
  tone?: "dark" | "light";
  className?: string;
  showCount?: boolean;
  /** "list": the whole list rises together (Awards, Archive); "rows": each row rises on its own (Publications). */
  appear?: "list" | "rows";
  /** Publications use 2px dividers (MEASURED --border-bottom-width: 2px). */
  thickLines?: boolean;
  /** Awards/Archive titles rise 30px into place; the Publications title is static (MEASURED). */
  titleAppear?: boolean;
  /** "publications": tighter phone/tablet rhythm with organisation + year on one line (MEASURED on /about). */
  variant?: "default" | "publications";
}) {
  return (
    <div className={cn(s.block, tone === "light" && s.light, thickLines && s.thick, variant === "publications" && s.publications, className)}>
      <InView className={cn(s.titleRow, titleAppear && s.titleAppear)}>
        <h2 id={id} className={cn(site.heading, s.heading)}>
          {title}
        </h2>
        {showCount && <p className={cn(site.label, s.count)}>/&nbsp; {rows.length}</p>}
      </InView>
      {appear === "list" ? (
        <InView as="ul" className={s.list}>
          {rows.map((r) => (
            <li key={r.title} className={s.row} data-cursor={r.cursor}>
              <RowContent row={r} />
            </li>
          ))}
        </InView>
      ) : (
        <ul className={s.listStatic}>
          {rows.map((r) => (
            <InView as="li" key={r.title} className={cn(s.row, s.rowAppear)}>
              <RowContent row={r} />
            </InView>
          ))}
        </ul>
      )}
    </div>
  );
}

function RowContent({ row }: { row: RecordRow }) {
  return (
    <>
      <p className={cn(site.label, s.rowTitle)}>{row.title}</p>
      <div className={s.rowMeta}>
        <p className={cn(site.body, s.rowOrg)}>{row.meta}</p>
        <p className={cn(site.label, s.rowYear)}>/&nbsp; {row.year}</p>
      </div>
    </>
  );
}
