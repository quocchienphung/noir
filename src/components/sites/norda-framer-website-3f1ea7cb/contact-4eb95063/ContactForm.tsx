"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "../shared/icons";
import site from "@/styles/sites/norda-framer-website-3f1ea7cb/site.module.css";
import s from "@/styles/sites/norda-framer-website-3f1ea7cb/contact-4eb95063/contact.module.css";

const FIELDS = [
  { name: "name", label: "Name", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "phone", label: "Phone Number", type: "tel", autoComplete: "tel" },
] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Contact form (Name, Email, Phone Number, Message — all required on the source).
 * Local demo only: validates in the browser and shows an explicit "not sent" notice; nothing is posted
 * or stored. A real integration would replace `onSubmit` with the studio's own endpoint.
 */
export function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    for (const f of [...FIELDS.map((f) => f.name), "message"]) {
      if (!String(data.get(f) ?? "").trim()) next[f] = "Required";
    }
    const email = String(data.get("email") ?? "").trim();
    if (email && !EMAIL.test(email)) next.email = "Enter a valid email";
    setErrors(next);
    if (Object.keys(next).length) {
      setSent(false);
      e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }
    e.currentTarget.reset();
    setSent(true);
  };

  const clear = (name: string) => {
    if (errors[name])
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    if (sent) setSent(false);
  };

  return (
    <form className={s.form} onSubmit={onSubmit} noValidate aria-describedby="nd-contact-status">
      {FIELDS.map((f) => (
        <label key={f.name} className={s.field} data-cursor="none">
          <span className={site.visuallyHidden}>{f.label}</span>
          <input
            name={f.name}
            type={f.type}
            required
            autoComplete={f.autoComplete}
            placeholder={f.label}
            className={s.input}
            aria-invalid={Boolean(errors[f.name])}
            onChange={() => clear(f.name)}
          />
          {errors[f.name] && <span className={s.error}>{errors[f.name]}</span>}
        </label>
      ))}
      <label className={s.field} data-cursor="none">
        <span className={site.visuallyHidden}>Message</span>
        <textarea
          name="message"
          required
          placeholder="Message"
          className={cn(s.input, s.textarea)}
          aria-invalid={Boolean(errors.message)}
          onChange={() => clear("message")}
        />
        {errors.message && <span className={s.error}>{errors.message}</span>}
      </label>
      <div className={s.submitRow}>
        <p id="nd-contact-status" className={cn(site.small, s.hint)} role="status" aria-live="polite">
          {sent ? "Demo only — this local reconstruction did not send your message." : "Please fill all the fields"}
        </p>
        <button type="submit" className={s.send} data-cursor="none">
          <span className={site.title}>Send</span>
          <span className={s.sendArrow} aria-hidden="true">
            <span className={s.sendDisc} />
            <ArrowRightIcon className={s.sendIcon} />
          </span>
        </button>
      </div>
    </form>
  );
}
