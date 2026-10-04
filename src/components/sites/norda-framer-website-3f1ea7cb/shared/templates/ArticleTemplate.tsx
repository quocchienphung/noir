import { cn } from "@/lib/utils";
import type { ArticleRecord } from "@/data/sites/norda-framer-website-3f1ea7cb/news";
import { routes } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";
import { ArrowLink } from "../ArrowLink";
import { Columns } from "../Columns";
import { ParallaxImage } from "../ParallaxImage";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/article.module.css";

/**
 * Shared CMS template for /news/<slug>. MEASURED (how-architecture-shapes-productivity 1440/390):
 * intro (title, Date + Reading Time, excerpt), framed parallax image, body of two heading/paragraph
 * sections separated by an empty paragraph (p +24px, h3 +40px), then "More News →".
 */
export function ArticleTemplate({ article }: { article: ArticleRecord }) {
  return (
    <main className={s.main}>
      <Columns plus className={s.intro} mainClassName={s.introMain}>
        <h1 className={cn(site.heading, s.title)}>{article.title}</h1>
        <dl className={s.params}>
          <div className={s.param}>
            <dt className={site.small}>Date</dt>
            <dd className={site.body}>{article.date}</dd>
          </div>
          <div className={s.param}>
            <dt className={site.small}>Reading Time</dt>
            <dd className={site.body}>{article.readingTime}</dd>
          </div>
        </dl>
        <p className={cn(site.body, s.excerpt)}>{article.excerpt}</p>
      </Columns>

      <div className={s.imageRow}>
        <ParallaxImage asset={article.cover.asset} alt={article.cover.alt} className={s.imageFrame} preload />
      </div>

      <Columns plus as="article" className={s.text} mainClassName={s.textMain}>
        <div className={s.body}>
          {article.sections.map((sec, i) => (
            <div key={sec.heading} className={s.section}>
              {i > 0 && <p className={cn(site.body, s.blank)} aria-hidden="true">{" "}</p>}
              <h2 className={cn(site.title, s.heading)}>{sec.heading}</h2>
              <p className={site.body}>{sec.body}</p>
            </div>
          ))}
        </div>
        <ArrowLink href={routes.news} label="More News" size="lg" />
      </Columns>
    </main>
  );
}
