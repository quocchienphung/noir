import { featuredArticle } from "@/data/sites/norda-framer-website-3f1ea7cb/home";
import { routes } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";
import { ArticleCard } from "../shared/ArticleCard";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/root-8a5edab2/home.module.css";

/** Home editorial feature (shared ArticleCard without a date), followed by the section gap. */
export function FeaturedArticle() {
  return (
    <ArticleCard
      id="nd-featured-title"
      href={routes.article(featuredArticle.slug)}
      title={featuredArticle.title}
      excerpt={featuredArticle.excerpt}
      image={featuredArticle.image}
      className={s.featured}
    />
  );
}
