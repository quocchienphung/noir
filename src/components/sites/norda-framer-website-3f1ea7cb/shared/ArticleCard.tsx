import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ImageRef } from "@/types/sites/norda-framer-website-3f1ea7cb";
import { ArrowLink } from "./ArrowLink";
import { Columns } from "./Columns";
import { ParallaxImage } from "./ParallaxImage";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/article-card.module.css";

/**
 * Editorial card (home feature, /news listing). MEASURED: 50vh parallax image linking to the article
 * (cursor "READ ARTICLE"), then optional date, title (64/50/40), excerpt and "Read Article →"; info 64px below.
 */
export function ArticleCard({
  id,
  href,
  title,
  excerpt,
  image,
  date,
  className,
}: {
  id: string;
  href: string;
  title: string;
  excerpt: string;
  image: ImageRef;
  date?: string;
  className?: string;
}) {
  return (
    <article className={cn(s.card, className)} aria-labelledby={id}>
      <Link href={href} className={s.imageLink} data-cursor="read-article" aria-label={title} tabIndex={-1}>
        <ParallaxImage asset={image.asset} alt={image.alt} className={s.imageFrame} />
      </Link>
      <Columns plus className={s.info} mainClassName={s.infoMain}>
        {date && <p className={cn(site.small, s.date)}>{date}</p>}
        <div className={s.text}>
          <h2 id={id} className={cn(site.heading, s.title)}>
            {title}
          </h2>
          <p className={cn(site.body, s.excerpt)}>{excerpt}</p>
        </div>
        <ArrowLink href={href} label="Read Article" size="md" />
      </Columns>
    </article>
  );
}
