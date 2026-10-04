"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "./icons";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/footer.module.css";

type Status = { kind: "idle" } | { kind: "error"; message: string } | { kind: "demo" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter sign-up. The source posts to a Framer form endpoint; this reconstruction never sends data —
 * it validates locally and shows an explicit "demo, not sent" confirmation. A real integration would
 * replace `onSubmit` with a call to the studio's own mailing-list endpoint.
 */
export function NewsletterForm() {
  const id = useId();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!value) return setStatus({ kind: "error", message: "Please enter your email address." });
    if (!EMAIL.test(value)) return setStatus({ kind: "error", message: "Please enter a valid email address." });
    e.currentTarget.reset();
    setStatus({ kind: "demo" });
  };

  return (
    <div className={s.form}>
      <h2 className={cn(site.title, s.formTitle)} id={`${id}-title`}>
        Sign up for our newsletter to receive updates and content
      </h2>
      <form className={s.formRow} onSubmit={onSubmit} noValidate aria-labelledby={`${id}-title`}>
        <label htmlFor={`${id}-email`} className={site.visuallyHidden}>
          Email
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Your email here"
          className={s.input}
          aria-invalid={status.kind === "error"}
          aria-describedby={`${id}-status`}
          onChange={() => status.kind !== "idle" && setStatus({ kind: "idle" })}
        />
        <button type="submit" className={s.submit} aria-label="Subscribe">
          <span className={s.submitBg} />
          <ArrowRightIcon className={s.submitIcon} />
        </button>
      </form>
      <p id={`${id}-status`} className={cn(s.status, status.kind === "error" && s.statusError)} role="status" aria-live="polite">
        {status.kind === "error" && status.message}
        {status.kind === "demo" && "Demo only — this local reconstruction does not send or store your email."}
      </p>
      <p className={cn(site.small, s.disclaimer)}>
        By signing up to receive emails from Nordå, you agree to our{" "}
        <Link href="/privacy-policy" className={s.disclaimerLink}>
          Privacy&nbsp;Policy
        </Link>
        . We treat your info responsibly. Unsubscribe anytime.
      </p>
    </div>
  );
}
