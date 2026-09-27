import Icon from "../lib/Icon.jsx";

export default function Modal({ open, onClose, title, children, labelledBy, wide, t }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center ps-[calc(1.25rem+var(--nav-gutter))] pe-5">
      {/* Darker scrim than the page wash so the cream card keeps its edge over
          the busy photo backdrop instead of blending into it.

          aria-hidden because the dialog already has a real, focusable Close
          button in its header — announcing a second, div-only click target gave
          screen-reader users a control they could not reach with a keyboard. */}
      <div aria-hidden="true" className="absolute inset-0 bg-[var(--brown-900)]/55 glass" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`relative z-10 w-full ${wide ? "max-w-md" : "max-w-sm"} bg-[var(--cream)] dark:bg-[var(--dark-card)] rounded-3xl p-6 max-h-[86vh] overflow-y-auto shadow-2xl`}
        style={{ animation: "popIn .18s ease" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id={labelledBy} className="font-semibold text-xl text-[var(--brown-900)] dark:text-[var(--dark-text)]">
            {title}
          </h2>
          <button
            aria-label={t?.close || "Close"}
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-[var(--brown-500)] dark:text-[var(--dark-muted)]"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
