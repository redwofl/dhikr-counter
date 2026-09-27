import Modal from "./Modal.jsx";
import { effectiveMaxFor } from "../lib/counterLogic.js";

export default function ResumeModal({ open, template, session, onContinue, onStartNew, t }) {
  if (!open || !template || !session) return null;
  const item = template.items[session.currentItemIndex];
  const effMax = effectiveMaxFor(session, item);
  return (
    <Modal open={open} onClose={onContinue} title={t.continueTitle} labelledBy="resume-title" t={t}>
      <p className="text-[var(--brown-700)] dark:text-[var(--dark-muted)] mb-1 text-sm">{item.transliteration}</p>
      <p className="text-2xl font-display font-semibold text-[var(--terra-dark)] dark:text-[var(--gold)] mb-6">
        {session.currentCount} / {effMax}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onStartNew}
          className="flex-1 py-3 rounded-2xl border border-[var(--beige)] dark:border-white/10 text-[var(--brown-700)] dark:text-[var(--dark-muted)] font-medium active:scale-95"
        >
          {t.startNew}
        </button>
        <button onClick={onContinue} className="flex-1 py-3 rounded-2xl bg-[var(--terra-dark)] text-white font-medium active:scale-95">
          {t.continueBtn}
        </button>
      </div>
    </Modal>
  );
}
