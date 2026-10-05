import type { Metadata } from "next";
import { NoirMark } from "@/components/noir/brand";
import { ButtonLink } from "@/components/noir/sections";
import { notFound } from "@/data/noir/site";
import s from "@/styles/noir/pages.module.css";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className={s.notFound}>
      <NoirMark size={160} className={s.notFoundMark} />
      <p className={s.notFoundCode}>404</p>
      <h1 className={s.notFoundTitle}>{notFound.title}</h1>
      <p className={s.muted}>{notFound.body}</p>
      <ButtonLink href={notFound.cta.href}>{notFound.cta.label}</ButtonLink>
    </main>
  );
}
