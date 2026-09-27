import Modal from "./Modal.jsx";

export default function InfoModal({ open, onClose, template, t }) {
  if (!open) return null;
  const text = (template && template.infoText) || t.infoGeneric;
  return (
    <Modal open={open} onClose={onClose} title={template ? template.name : t.about} labelledBy="info-title" wide t={t}>
      <div className="text-sm text-[var(--brown-700)] dark:text-[var(--dark-muted)] leading-relaxed whitespace-pre-line mb-6">{text}</div>
      <div className="flex justify-end">
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-[var(--terra-dark)]/10 text-[var(--terra-dark)] font-semibold active:opacity-60">
          {t.close}
        </button>
      </div>
    </Modal>
  );
}
