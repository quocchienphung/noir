import Image from "next/image";
import { cn } from "@/lib/utils";
import type { RichBlock } from "@/types/sites/norda-framer-website-3f1ea7cb";
import { imageAsset } from "@/lib/sites/norda-framer-website-3f1ea7cb/media";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/rich-text.module.css";

/** Renders "{bold}" tokens as <strong> and "\n" as line breaks (a trailing "\n\n" leaves a blank line). */
function inline(text: string) {
  return text.split("\n").flatMap((line, li, lines) => [
    ...line.split(/(\{[^}]+\})/).map((part, i) =>
      part.startsWith("{") && part.endsWith("}") ? <strong key={`${li}-${i}`}>{part.slice(1, -1)}</strong> : part,
    ),
    li < lines.length - 1 ? <br key={`br-${li}`} /> : null,
  ]);
}

/**
 * Body copy as authored on the source. List items are written there as separate paragraphs
 * prefixed with "—", so they keep the 24px paragraph rhythm; semantically they are a <ul>.
 */
export function RichText({
  blocks,
  className,
  bullets = "dash",
}: {
  blocks: RichBlock[];
  className?: string;
  /** "dash": accordion lists written as "—" paragraphs; "disc": real bullet lists (policy, jobs). */
  bullets?: "dash" | "disc";
}) {
  return (
    <div className={cn(site.body, s.rich, className)}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return <p key={i}>{inline(b.text)}</p>;
          case "h2":
            return <h2 key={i} className={s.h2}>{b.text}</h2>;
          case "h3":
            return <h3 key={i} className={s.h3}>{b.text}</h3>;
          case "h4":
            return <h4 key={i} className={s.h4}>{b.text}</h4>;
          case "quote":
            return <blockquote key={i} className={s.quote}>{b.text}</blockquote>;
          case "ul":
            return (
              <ul key={i} className={bullets === "disc" ? s.disc : s.ul}>
                {b.items.map((item) => (
                  <li key={item}>
                    {bullets === "dash" && <span aria-hidden="true">—&nbsp; </span>}
                    {inline(item)}
                  </li>
                ))}
              </ul>
            );
          case "img": {
            const a = imageAsset(b.image.asset);
            return (
              <figure key={i} className={s.figure}>
                <Image src={a.src} alt={b.image.alt} width={a.width} height={a.height} sizes="(min-width: 1200px) 624px, 100vw" className={s.img} />
              </figure>
            );
          }
        }
      })}
    </div>
  );
}
