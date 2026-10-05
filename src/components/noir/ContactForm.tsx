"use client";

import { useId, useRef, useState } from "react";
import { contact, contactDestination } from "@/data/noir/site";
import s from "@/styles/noir/form.module.css";

type Status = "idle" | "invalid" | "not-sent" | "copied";

/**
 * Project enquiry form. No inbox or backend exists for this site yet (`contactDestination` is empty), so
 * submitting never pretends to send: it validates, keeps everything typed, and says plainly that the
 * message did not leave the browser — with a one-click copy of the composed message.
 */
export function ContactForm() {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>("idle");

  const compose = () => {
    const data = new FormData(formRef.current ?? undefined);
    const get = (k: string) => String(data.get(k) ?? "").trim();
    return [
      `Name: ${get("name")}`,
      `Email: ${get("email")}`,
      `Project type: ${get("type")}`,
      get("budget") ? `Budget: ${get("budget")}` : null,
      "",
      get("message"),
    ]
      .filter((line) => line !== null)
      .join("\n");
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    form.setAttribute("data-touched", "");
    if (!form.checkValidity()) {
      setStatus("invalid");
      form.reportValidity();
      return;
    }
    // A live destination would be used here; none is configured, so report that honestly.
    if (!contactDestination.endpoint) {
      setStatus("not-sent");
      requestAnimationFrame(() => statusRef.current?.focus());
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(compose());
      setStatus("copied");
    } catch {
      setStatus("not-sent");
    }
  };

  return (
    <form ref={formRef} className={s.form} onSubmit={onSubmit} noValidate aria-describedby={`${id}-note`}>
      <div className={s.grid}>
        <label className={s.field}>
          <span className={s.label}>Name</span>
          <input className={s.input} name="name" autoComplete="name" required maxLength={120} />
        </label>
        <label className={s.field}>
          <span className={s.label}>Email</span>
          <input className={s.input} name="email" type="email" autoComplete="email" required maxLength={200} />
        </label>
        <label className={s.field}>
          <span className={s.label}>Project type</span>
          <select className={s.input} name="type" required defaultValue="">
            <option value="" disabled>
              Choose one
            </option>
            {contact.projectTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className={s.field}>
          <span className={s.label}>
            Budget <span className={s.optional}>(optional)</span>
          </span>
          <select className={s.input} name="budget" defaultValue="">
            <option value="">Prefer not to say</option>
            {contact.budgets.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
        <label className={`${s.field} ${s.full}`}>
          <span className={s.label}>Project description</span>
          <textarea
            className={`${s.input} ${s.textarea}`}
            name="message"
            required
            minLength={20}
            maxLength={5000}
            rows={6}
            placeholder="What are you building, what exists already, and when does it need to ship?"
          />
        </label>
      </div>

      <div className={s.actions}>
        <button type="submit" className={s.submit}>
          Send enquiry
        </button>
        <p id={`${id}-note`} className={s.note}>
          {contactDestination.email
            ? `Messages go to ${contactDestination.email}.`
            : "No inbox is connected to this site yet — submitting will not send anything."}
        </p>
      </div>

      <div ref={statusRef} className={s.status} role="status" aria-live="polite" tabIndex={-1} data-status={status}>
        {status === "invalid" ? <p>Please complete the highlighted fields.</p> : null}
        {status === "not-sent" || status === "copied" ? (
          <>
            <p className={s.statusTitle}>{contact.notSent.title}</p>
            <p>{contact.notSent.body}</p>
            <button type="button" className={s.copy} onClick={copy}>
              {status === "copied" ? "Copied to clipboard" : "Copy message"}
            </button>
          </>
        ) : null}
      </div>
    </form>
  );
}
