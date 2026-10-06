import type { Metadata } from "next";
import { NoirMark } from "@/components/noir/brand";
import { ButtonLink } from "@/components/noir/sections";
import { notFound } from "@/data/noir/site";
import s from "@/styles/noir/pages.module.css";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className={s.notFound}>
      <NoirMark size={160} className={s.notFoundMark} motion="visual" />
      <p className={s.notFoundCode} data-m="eyebrow">
        404
      </p>
      <h1 className={s.notFoundTitle} data-m="heading">
        {notFound.title}
      </h1>
      <p className={s.muted} data-m="lead">
        {notFound.body}
      </p>
      <ButtonLink href={notFound.cta.href} motion="actions">
        {notFound.cta.label}
      </ButtonLink>
    </main>
  );
}
