# ContactForm

- **Identity:** `/contact` · `contact-4eb95063/ContactForm.tsx` · `contact.module.css` · evidence compact dumps (Form subtree), `tools/`: `ff.mjs`, `ff2.mjs`.
- **Structure:** `form[noValidate][aria-describedby=nd-contact-status]` → 3 `label` (visually hidden text + input name/email/tel with autocomplete) → `label` + `textarea` → submit row (`p#nd-contact-status[role=status][aria-live=polite]`, `button[type=submit]` "Send" + arrow disc).
- **State machine:** `idle` → submit → (`errors` map, focus first invalid) | (`sent`: form reset, demo message); editing a field clears its error and the sent notice.
- **Validation:** all fields required (as on the source); email `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
- **Integration point:** replace `onSubmit` with a call to the studio's own endpoint; no data is persisted.
- **Acceptance:** `qa-behaviors` "contact form: required fields + local demo confirmation".
