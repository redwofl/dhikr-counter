import Modal from "./Modal.jsx";

export default function ConfirmDialog({ open, title, message, confirmLabel, onCancel, onConfirm, danger, t }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} labelledBy="confirm-title" t={t}>
      <p className="text-[var(--brown-700)] dark:text-[var(--dark-muted)] mb-6 text-sm">{message}</p>
      <div className="flex justify-end gap-5">
        <button onClick={onCancel} className="px-2 py-2 text-[var(--brown-500)] dark:text-[var(--dark-muted)] font-medium active:opacity-60">
          {t?.cancel || "Cancel"}
        </button>
        <button
          onClick={onConfirm}
          className={`px-2 py-2 font-semibold active:opacity-60 ${danger ? "text-red-500 dark:text-red-400" : "text-[var(--terra-dark)] dark:text-[var(--gold)]"}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
