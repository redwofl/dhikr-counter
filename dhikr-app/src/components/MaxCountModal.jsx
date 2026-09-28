import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import Icon from "../lib/Icon.jsx";
import { isValidMaxCount } from "../lib/counterLogic.js";

export default function MaxCountModal({ open, onClose, initial, onSubmit, t }) {
  const [val, setVal] = useState(initial || 33);
  useEffect(() => {
    if (open) setVal(initial || 33);
  }, [open, initial]);

  const valid = isValidMaxCount(val);
  const sliderMax = val > 1000 ? val : 1000;

  return (
    <Modal open={open} onClose={onClose} title={t.setMaxCount} labelledBy="maxcount-title" t={t}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-display text-3xl font-semibold text-[var(--brown-900)] dark:text-[var(--dark-text)] tabular-nums">{val}</span>
        <div className="flex items-center gap-2">
          <button
            aria-label={t.decrease}
            onClick={() => setVal((v) => Math.max(1, v - 1))}
            className="w-9 h-9 rounded-full bg-[var(--beige)]/70 dark:bg-white/10 flex items-center justify-center text-[var(--brown-700)] dark:text-[var(--dark-muted)] active:scale-90"
          >
            <Icon name="minus" size={16} />
          </button>
          <button
            aria-label={t.increase}
            onClick={() => setVal((v) => Math.min(10000, v + 1))}
            className="w-9 h-9 rounded-full bg-[var(--beige)]/70 dark:bg-white/10 flex items-center justify-center text-[var(--brown-700)] dark:text-[var(--dark-muted)] active:scale-90"
          >
            <Icon name="plus" size={16} />
          </button>
        </div>
      </div>
      <input
        type="range"
        min={1}
        max={sliderMax}
        value={Math.min(val, sliderMax)}
        onChange={(e) => setVal(parseInt(e.target.value, 10))}
        className="w-full mb-5"
      />
      <div className="flex gap-2 mb-6">
        {[33, 100, 1000].map((p) => (
          <button
            key={p}
            onClick={() => setVal(p)}
            className={`flex-1 py-2 rounded-full text-sm font-medium border transition ${
              val === p
                ? "bg-[var(--terra)]/15 border-[var(--terra)] text-[var(--terra-dark)] dark:bg-[var(--gold)]/15 dark:border-[var(--gold)] dark:text-[var(--gold)]"
                : "border-[var(--beige)] dark:border-white/10 text-[var(--brown-700)] dark:text-[var(--dark-muted)]"
            }`}
          >
            {p}x
          </button>
        ))}
      </div>
      {!valid && <p className="text-xs text-red-500 dark:text-red-400 mb-2">{t.maxCountError}</p>}
      <div className="flex justify-end gap-5">
        <button onClick={onClose} className="px-2 py-2 text-[var(--brown-500)] dark:text-[var(--dark-muted)] font-medium active:opacity-60">
          {t.cancel}
        </button>
        <button
          disabled={!valid}
          onClick={() => {
            onSubmit(val);
            onClose();
          }}
          className="px-2 py-2 font-semibold text-[var(--terra-dark)] dark:text-[var(--gold)] disabled:opacity-40 active:opacity-60"
        >
          {t.submit}
        </button>
      </div>
    </Modal>
  );
}
