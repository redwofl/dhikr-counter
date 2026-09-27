import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import Icon from "../lib/Icon.jsx";

export default function AutoCounterModal({ open, onClose, onConfirm, t }) {
  const [tab, setTab] = useState("touch");
  const [taps, setTaps] = useState([]);
  const [learnedMs, setLearnedMs] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(2);

  useEffect(() => {
    if (open) {
      setTaps([]);
      setLearnedMs(null);
      setTab("touch");
      setTimerSeconds(2);
    }
  }, [open]);

  const handleStartTap = () => {
    const now = performance.now();
    setTaps((prev) => {
      const next = [...prev, now].slice(-3);
      if (next.length === 3) {
        const d1 = next[1] - next[0];
        const d2 = next[2] - next[1];
        setLearnedMs(Math.round((d1 + d2) / 2));
      }
      return next;
    });
  };

  const ready = tab === "touch" ? learnedMs !== null : timerSeconds > 0;
  const intervalMs = tab === "touch" ? learnedMs : timerSeconds * 1000;

  return (
    <Modal open={open} onClose={onClose} title={t.autoCounter} labelledBy="autocounter-title" t={t}>
      <div className="flex mb-5 border-b border-[var(--beige)] dark:border-white/10">
        <button
          onClick={() => setTab("touch")}
          className={`flex-1 pb-2.5 text-sm font-medium border-b-2 -mb-px ${
            tab === "touch" ? "border-[var(--terra-dark)] text-[var(--terra-dark)]" : "border-transparent text-[var(--brown-500)] dark:text-[var(--dark-muted)]"
          }`}
        >
          {t.touch}
        </button>
        <button
          onClick={() => setTab("timer")}
          className={`flex-1 pb-2.5 text-sm font-medium border-b-2 -mb-px ${
            tab === "timer" ? "border-[var(--terra-dark)] text-[var(--terra-dark)]" : "border-transparent text-[var(--brown-500)] dark:text-[var(--dark-muted)]"
          }`}
        >
          {t.timer}
        </button>
      </div>

      {tab === "touch" ? (
        <>
          <p className="text-sm text-[var(--brown-700)] dark:text-[var(--dark-muted)] mb-6 text-center">{t.autoCounterTouchHint}</p>
          <div className="flex justify-center mb-6">
            <button
              onClick={handleStartTap}
              className="w-28 h-28 rounded-full border-2 border-[var(--brown-900)]/70 dark:border-white/40 flex items-center justify-center font-medium text-[var(--brown-900)] dark:text-[var(--dark-text)] active:scale-95 transition"
            >
              {learnedMs !== null ? `${(learnedMs / 1000).toFixed(2)}s` : t.start}
            </button>
          </div>
          <p className="text-center text-xs text-[var(--brown-500)] dark:text-[var(--dark-muted)] mb-6">
            {taps.length}/3 {t.taps}
          </p>
        </>
      ) : (
        <div className="mb-8">
          <label className="block text-xs uppercase tracking-wide text-[var(--brown-500)] dark:text-[var(--dark-muted)] mb-2">{t.intervalSeconds}</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTimerSeconds((s) => Math.max(1, s - 1))}
              className="w-9 h-9 rounded-full bg-[var(--beige)]/70 dark:bg-white/10 flex items-center justify-center active:scale-90"
            >
              <Icon name="minus" size={16} />
            </button>
            <span className="flex-1 text-center font-display text-2xl font-semibold">{timerSeconds}s</span>
            <button
              onClick={() => setTimerSeconds((s) => Math.min(60, s + 1))}
              className="w-9 h-9 rounded-full bg-[var(--beige)]/70 dark:bg-white/10 flex items-center justify-center active:scale-90"
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <button
          disabled={!ready}
          onClick={() => {
            onConfirm(intervalMs);
            onClose();
          }}
          className="w-full py-3 rounded-2xl bg-[var(--terra-dark)] text-white font-semibold disabled:opacity-30 active:scale-95 transition"
        >
          {t.ok}
        </button>
        <button onClick={onClose} className="w-full py-2 text-[var(--brown-500)] dark:text-[var(--dark-muted)] font-medium active:opacity-60">
          {t.close}
        </button>
      </div>
    </Modal>
  );
}
