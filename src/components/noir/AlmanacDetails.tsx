"use client";

import { TransitionLink } from "./motion/TransitionLink";
import { useEffect, useRef, useState } from "react";
import type { AlmanacCard, DemoSectionSlot, LiveSlot } from "@/data/noir/cards-almanac";
import s from "@/styles/noir/cards-almanac.module.css";

const READINESS_LABEL: Record<DemoSectionSlot["readiness"], string> = { empty: "Empty", template: "Template", live: "Live" };
/** Default sandbox for author-supplied demos: no same-origin, so unknown code is never trusted with ours. */
const DEFAULT_SANDBOX = "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox";

/** A live URL that must never be framed: this home page itself (recursive embedding). */
function isSelfHome(url: string) {
  try {
    const u = new URL(url, window.location.href);
    return u.origin === window.location.origin && (u.pathname === "/" || u.pathname === "");
  } catch {
    return true;
  }
}

/**
 * Project details (the plus control's proposed NOIR behaviour — the public reference never shows it activated).
 * A native modal <dialog>: the rest of the page is inert while it is open, Escape and the close button dismiss
 * it, and focus returns to the control that opened it. At most one live demo is embedded, only after the visitor
 * asks for it; closing or switching removes it. Every live slot also offers "Open in a new tab".
 */
export function AlmanacDetails({ card, onClose }: { card: AlmanacCard | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [embedded, setEmbedded] = useState<string | null>(null);
  const [lastCard, setLastCard] = useState(card);
  // switching or closing removes any embed (adjusted during render, not in an effect)
  if (lastCard !== card) {
    setLastCard(card);
    setEmbedded(null);
  }

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (card && !d.open) {
      const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      d.showModal();
      const root = document.documentElement;
      const prev = root.style.overflow;
      root.style.overflow = "hidden";
      return () => {
        root.style.overflow = prev;
        if (d.open) d.close();
        opener?.focus({ preventScroll: true });
      };
    }
  }, [card]);

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby="almanac-details-title"
      onClose={onClose}
      onClick={(e) => {
        // a click on the backdrop (the dialog box itself, outside its content) closes
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {card ? (
        <div className={s.dialogInner}>
          <div className={s.dialogHead}>
            <div>
              <p className={s.meta}>{card.meta}</p>
              <h2 id="almanac-details-title" className={s.dialogTitle}>
                {card.title}
              </h2>
            </div>
            <button type="button" className={s.close} onClick={onClose}>
              Close
            </button>
          </div>
          <p className={s.dialogBody}>{card.description}</p>
          {card.stack.length ? (
            <ul className={s.stack} aria-label="Stack">
              {card.stack.map((t) => (
                <li key={t} className={s.pill}>
                  {t}
                </li>
              ))}
            </ul>
          ) : null}
          {card.link ? (
            <TransitionLink className={s.dialogLink} href={card.link.href} onClick={onClose}>
              {card.link.label} →
            </TransitionLink>
          ) : null}

          <h3 className={s.sectionsTitle}>Demo sections</h3>
          <ul className={s.slots}>
            {card.sections.map((slot) => (
              <li key={slot.id} className={s.slotItem} data-slot={slot.id} data-readiness={slot.readiness}>
                <div className={s.slotHead}>
                  <h4 className={s.slotLabel}>{slot.label}</h4>
                  <span className={s.badge} data-readiness={slot.readiness}>
                    {READINESS_LABEL[slot.readiness]}
                  </span>
                </div>
                {slot.readiness === "empty" ? <p className={s.slotText}>{slot.emptyMessage}</p> : null}
                {slot.readiness === "template" ? (
                  <>
                    <p className={s.slotText}>{slot.body}</p>
                    {slot.link ? (
                      <div className={s.slotActions}>
                        <TransitionLink className={s.slotLink} href={slot.link.href} onClick={onClose}>
                          {slot.link.label} →
                        </TransitionLink>
                      </div>
                    ) : null}
                  </>
                ) : null}
                {slot.readiness === "live" ? (
                  <LiveDemo slot={slot} title={card.title} embedded={embedded === slot.id} onEmbed={(on) => setEmbedded(on ? slot.id : null)} />
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </dialog>
  );
}

function LiveDemo({ slot, title, embedded, onEmbed }: { slot: LiveSlot; title: string; embedded: boolean; onEmbed: (on: boolean) => void }) {
  const url = slot.liveUrl + (slot.sectionAnchor ?? "");
  const canEmbed = slot.embeddable && !isSelfHome(url);
  return (
    <>
      <p className={s.slotText}>{slot.description}</p>
      <div className={s.slotActions}>
        {canEmbed ? (
          <button type="button" className={s.slotButton} aria-pressed={embedded} onClick={() => onEmbed(!embedded)}>
            {embedded ? "Close demo" : "Load demo here"}
          </button>
        ) : null}
        <a className={s.slotLink} href={url} target="_blank" rel="noopener noreferrer">
          Open demo in a new tab ↗
        </a>
      </div>
      {!canEmbed ? <p className={s.slotText}>This demo opens in its own tab.</p> : null}
      {canEmbed && embedded ? (
        <iframe className={s.frame} src={url} title={`${title} — ${slot.label} (live demo)`} sandbox={slot.sandbox ?? DEFAULT_SANDBOX} referrerPolicy="no-referrer" loading="eager" />
      ) : null}
    </>
  );
}
