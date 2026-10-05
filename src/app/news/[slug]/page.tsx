import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleTemplate } from "@/components/sites/norda-framer-website-3f1ea7cb/shared/templates/ArticleTemplate";
import { articles, getArticle } from "@/data/sites/norda-framer-website-3f1ea7cb/news";
import { decodeSlug } from "@/lib/sites/norda-framer-website-3f1ea7cb/routes";

// Source route: /news/<slug> — six CMS entries, unknown slugs 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: PageProps<"/news/[slug]">): Promise<Metadata> {
  const article = getArticle(decodeSlug((await params).slug));
  return article ? { title: article.pageTitle, description: article.excerpt } : {};
}

export default async function ArticlePage({ params }: PageProps<"/news/[slug]">) {
  const article = getArticle(decodeSlug((await params).slug));
  if (!article) notFound();
  return <ArticleTemplate article={article} />;
}
