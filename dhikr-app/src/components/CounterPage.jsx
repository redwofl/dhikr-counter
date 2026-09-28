import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "../lib/Icon.jsx";
import TasbihBeads from "./TasbihBeads.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import MaxCountModal from "./MaxCountModal.jsx";
import InfoModal from "./InfoModal.jsx";
import AutoCounterModal from "./AutoCounterModal.jsx";
import Confetti from "./Confetti.jsx";
import { playTapSound, playCompleteSound, vibrate } from "../lib/sound.js";
import { arabicHeadlineClass, arabicBloomClass } from "../lib/text.js";

import { applyTap, resetSession, setCustomMax, effectiveMaxFor } from "../lib/counterLogic.js";

/** Small circular daily-goal progress ring shown in the top bar */
export default function CounterPage({ template, session, setSession, settings, t, onOpenTemplates, onOpenSettings, onOpenAdhkar, addRepetitions, dailyGoal, todayReps, goalRemaining, streak, timerTick, autoCounterPending, onAutoCounterPendingHandled, modalBinding, onAutoRunningChange }) {
  const [showReset, setShowReset] = useState(false);
  const [showMaxCount, setShowMaxCount] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showAutoCounter, setShowAutoCounter] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const autoTimerRef = useRef(null);
  const intervalRef = useRef(null);
  const lastAutoTickRef = useRef(timerTick);

  const itemIndex = session ? session.currentItemIndex : 0;
  const currentItem = template ? template.items[itemIndex] : null;

  const handleTap = useCallback(() => {
    if (!template || !session || session.completed) return;
    if (settings.vibration) vibrate(15);
    if (settings.sound) playTapSound(settings.soundType);
    setPulsing(true);
    setTimeout(() => setPulsing(false), 150);

    const item = template.items[session.currentItemIndex];
    const wasLastItem = session.currentItemIndex + 1 >= template.items.length;
    const effMax = effectiveMaxFor(session, item);
    const willComplete = session.currentCount + 1 >= effMax;

    // Keep the state updater pure: side effects (sounds, vibration, the daily
    // counter, auto-stop) run here in the handler — never inside setSession.
    setSession((prev) => applyTap(template, prev));
    addRepetitions(1);

    if (willComplete) {
      if (wasLastItem) {
        if (settings.sound) playCompleteSound();
        if (settings.vibration) vibrate([10, 40, 10, 40, 10]);
        setAutoRunning(false);
      } else if (settings.vibration) {
        vibrate([10, 40, 10]);
      }
    }
  }, [template, session, settings, setSession, addRepetitions]);

  // auto-counter engine
  useEffect(() => {
    if (autoRunning && intervalRef.current) {
      autoTimerRef.current = setInterval(() => handleTap(), intervalRef.current);
      return () => clearInterval(autoTimerRef.current);
    }
  }, [autoRunning, handleTap]);

  useEffect(() => {
    if (session && session.completed) setAutoRunning(false);
  }, [session && session.completed]); // eslint-disable-line react-hooks/exhaustive-deps

  // report auto-counter running state up to App (for the nav rail icon)
  useEffect(() => {
    if (onAutoRunningChange) onAutoRunningChange(autoRunning);
  }, [autoRunning, onAutoRunningChange]);

  // nav rail timer button: consume one generation tick — stop while the timer
  // is running, otherwise toggle the duration dialog. A second tap on the icon
  // while the Auto Counter dialog is already open closes it.
  useEffect(() => {
    if (timerTick === lastAutoTickRef.current) return;
    lastAutoTickRef.current = timerTick;
    if (autoRunning) setAutoRunning(false);
    else if (showAutoCounter) setShowAutoCounter(false);
    else setShowAutoCounter(true);
  }, [timerTick]); // eslint-disable-line react-hooks/exhaustive-deps

  // The Auto Counter dialog was requested from another tab (nav rail press):
  // open it on arrival, then clear the pending flag.
  useEffect(() => {
    if (autoCounterPending) {
      setShowAutoCounter(true);
      if (onAutoCounterPendingHandled) onAutoCounterPendingHandled();
    }
  }, [autoCounterPending, onAutoCounterPendingHandled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Expose the innermost open counter dialog to App's hardware-back handler
  // (reset / max count / info / auto counter), innermost first.
  useEffect(() => {
    if (!modalBinding) return;
    if (showAutoCounter) modalBinding.current = { open: true, close: () => setShowAutoCounter(false) };
    else if (showMaxCount) modalBinding.current = { open: true, close: () => setShowMaxCount(false) };
    else if (showInfo) modalBinding.current = { open: true, close: () => setShowInfo(false) };
    else if (showReset) modalBinding.current = { open: true, close: () => setShowReset(false) };
    else modalBinding.current = { open: false, close: () => {} };
    return () => { modalBinding.current = { open: false, close: () => {} };
    };
  }, [modalBinding, showAutoCounter, showMaxCount, showInfo, showReset]);

  // Stop the auto counter whenever the page unmounts or the app is hidden,
  // so leaving the tab (or locking the phone) never leaves taps firing.
  useEffect(() => {
    if (!autoRunning) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") setAutoRunning(false);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      setAutoRunning(false); // unmount (e.g. navigated to another tab)
    };
  }, [autoRunning]);

  // `currentItem` is part of the guard, not just `template`: editing a custom
  // template while its session is in progress (or importing one) can leave
  // `session.currentItemIndex` pointing past the end of a shortened items
  // array. `effectiveMaxFor` then dereferenced `item.id` on `undefined`,
  // throwing during render and dumping the user into the ErrorBoundary, whose
  // only recovery button wipes localStorage — i.e. losing the whole session.
  if (!template || !session || !currentItem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center counter-bg -ms-[var(--nav-gutter)] [--bg-bleed:0px]">
        <p className="font-display text-2xl text-[var(--brown-900)] dark:text-[var(--dark-text)] mb-4">{t.noSavedSession}</p>
        <button onClick={onOpenTemplates} className="px-6 py-3 rounded-2xl bg-[var(--terra-dark)] text-white font-medium active:scale-95">
          {t.chooseTemplate}
        </button>
      </div>
    );
  }

  const handleReset = () => {
    setAutoRunning(false);
    setSession((prev) => resetSession(prev));
    setShowReset(false);
  };

  const handleSetMax = (newMax) => {
    // The target is stored exactly as typed. This used to be clamped up to the
    // live count (`Math.max(newMax, prev.currentCount)`), which threw away the
    // value the user had just entered without telling them: on a 33-count round
    // at 5/33, asking for 3 stored 5 and the dialog re-opened showing 5. The
    // clamp also made the next tap complete the round, so a tap that
    // corresponded to no new dhikr got recorded as a repetition.
    // `effectiveCount` below already clamps the *display* to the new max, so a
    // lowered target renders as e.g. 3 / 3 and the count stays honest.
    setSession((prev) => setCustomMax(prev, currentItem.id, newMax));
  };

  const effectiveMax = effectiveMaxFor(session, currentItem);
  const effectiveCount = Math.min(session.currentCount, effectiveMax);
  const round = itemIndex + 1;
  const totalItems = template.items.length;

  if (session.completed) {
    const lastItem = template.items[template.items.length - 1];
    const lastEffMax = effectiveMaxFor(session, lastItem);
    // Report the count the round actually ended on, not the target. Printing
    // `lastEffMax / lastEffMax` overstated it whenever the max was raised after
    // the reps were counted (33 taps against a target later raised to 100
    // claimed "100 / 100").
    const lastCount = Math.min(session.currentCount, lastEffMax);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-8 text-center counter-bg safe-top safe-bottom -ms-[var(--nav-gutter)] [--bg-bleed:0px]">
        <Confetti />
        <div className="w-16 h-16 rounded-full mb-6 flex items-center justify-center bg-[var(--terra)]/15 text-[var(--terra-dark)] dark:text-[var(--gold)]">
          <Icon name="check" size={26} />
        </div>
        <p className={`font-arabic gold-lux ${arabicHeadlineClass(lastItem.arabic)} font-bold text-center mb-2 break-words`}>{lastItem.arabic}</p>
        <h2 className="font-display text-3xl font-semibold text-[var(--terra-dark)] dark:text-[var(--gold)] mt-3 mb-1">{t.dhikrComplete}</h2>
        <p className="text-[var(--brown-500)] dark:text-[var(--dark-muted)] mb-6">
          {lastCount} / {lastEffMax}
        </p>
        <p className="text-sm text-[var(--brown-500)] dark:text-[var(--dark-muted)] mb-1">{t.youCompleted}</p>
        <p className="font-display text-xl text-[var(--terra-dark)] dark:text-[var(--gold)] mb-10">{template.name}</p>
        <button onClick={handleReset} className="w-full max-w-xs py-4 rounded-2xl bg-[var(--terra-dark)] text-white font-semibold active:scale-95 mb-3">
          {t.startAgain}
        </button>
        <button
          onClick={onOpenTemplates}
          className="w-full max-w-xs py-4 rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)] dark:border-white/10 text-[var(--brown-700)] dark:text-[var(--dark-muted)] font-medium active:scale-95"
        >
          {t.chooseAnother}
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col counter-bg safe-top -ms-[var(--nav-gutter)] [--bg-bleed:0px]">
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-2">
        {/* stacked dhikr list: only the current dhikr (large) and upcoming (muted).
            The names of Allah are set in white and sit directly on the wall band
            across the top of the page, which is dark enough here to keep them legible. */}
        <div className="w-full max-w-[280px] text-center mb-5">
          {template.items.map((it, idx) => {
            if (idx < itemIndex) return null;
            if (idx === itemIndex) {
              // Full vocalized Arabic (with harakat) — the correct spelling of
              // the dhikr, exactly as authored in the template data.
              return (
                <div key={it.id} className="my-3">
                  <p
                    className={`font-arabic gold-lux ${arabicHeadlineClass(it.arabic)} font-bold leading-snug text-center break-words`}
                    dir="rtl"
                  >{it.arabic}</p>
                  <p className="font-display text-xl font-semibold text-white/90 mt-0.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">{it.transliteration}</p>
                </div>
              );
            }
            return (
              <div key={it.id} className="my-1">
                <p className="text-sm text-white/50 leading-snug break-words">
                  <span dir="rtl" className="font-arabic">{it.arabic}</span> <span className="font-display ms-1.5">{it.transliteration}</span>
                </p>
              </div>
            );
          })}
        </div>

        {/* icon row: templates / info / reset */}
        <div className="flex items-center gap-3 mb-4">
          <button
            aria-label={t.templates}
            onClick={onOpenTemplates}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[var(--ivory)] active:scale-90"
          >
            <Icon name="list" size={18} />
          </button>
          <button
            aria-label={t.info}
            onClick={() => setShowInfo(true)}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[var(--ivory)] active:scale-90"
          >
            <Icon name="info" size={18} />
          </button>
          <button
            aria-label={t.reset}
            onClick={() => setShowReset(true)}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-[var(--ivory)] active:scale-90"
          >
            <Icon name="reset" size={18} />
          </button>
        </div>

        <p className="text-white text-sm mb-0.5">{template.name}</p>
        <p className="text-white/70 text-sm mb-3">
          {t.round}: {round}/{totalItems}
        </p>

        <div className="my-2 w-full flex justify-center">
          <TasbihBeads
            count={effectiveCount}
            max={effectiveMax}
            pulsing={pulsing}
            onTap={handleTap}
            tapLabel={t.tapToCount}
            palette={settings.beadPalette || "rosewoodCopper"}
            arabicName={currentItem ? currentItem.arabic : ""}
          />
        </div>
        <button onClick={() => setShowMaxCount(true)} className="text-xs text-white/70 underline underline-offset-2 mt-1">
          {t.setMaxCount}
        </button>
      </main>

      <ConfirmDialog open={showReset} title={t.resetTitle} message={t.resetMessage} confirmLabel={t.reset} onCancel={() => setShowReset(false)} onConfirm={handleReset} danger t={t} />
      <MaxCountModal open={showMaxCount} onClose={() => setShowMaxCount(false)} initial={effectiveMax} onSubmit={handleSetMax} t={t} />
      <InfoModal open={showInfo} onClose={() => setShowInfo(false)} template={template} t={t} />
      <AutoCounterModal
        open={showAutoCounter}
        onClose={() => setShowAutoCounter(false)}
        t={t}
        onConfirm={(ms) => {
          intervalRef.current = Math.max(300, ms || 1000);
          setAutoRunning(true);
        }}
      />
    </div>
  );
}
