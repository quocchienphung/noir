import type { Metadata } from "next";
import { PageHeader } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/PageHeader";
import { InnerMain } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/InnerMain";
import { ArticleCard } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/ArticleCard";
import { articles, newsHeader } from "@/data/sites/norda-framer-website-3f1ea7cb/news";
import { routes } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/news.module.css";

// Source route: /news (page key news-f46b16ed)
export const metadata: Metadata = { title: "Nordå Architects" };

export default function NewsPage() {
  return (
    <>
      <PageHeader image={newsHeader.image} objectPosition={newsHeader.objectPosition} intro={newsHeader.intro} title={newsHeader.title} />
      <InnerMain>
        <div className={s.list}>
          {articles.map((a, i) => (
            <ArticleCard
              key={a.slug}
              id={`nd-news-${i}`}
              href={routes.article(a.slug)}
              title={a.title}
              excerpt={a.excerpt}
              image={a.cover}
              date={a.date}
            />
          ))}
        </div>
      </InnerMain>
    </>
  );
}
