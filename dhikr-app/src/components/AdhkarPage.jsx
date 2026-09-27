import { useState } from "react";
import Icon from "../lib/Icon.jsx";
import ScreenHeader from "./ScreenHeader.jsx";
import { MORNING_ADHKAR, EVENING_ADHKAR } from "../data/adhkar.js";
import { playTapSound, vibrate } from "../lib/sound.js";
import { todayKey } from "../lib/storage.js";

const PRAYERS = ["fajr", "dhuhr", "asr", "maghrib", "isha", "sunnahRawatib"];

export default function AdhkarPage({ t, settings, onBack, adhkarProgress, setAdhkarProgress, salahProgress, setSalahProgress }) {
  const [tab, setTab] = useState("morning"); // "morning" | "evening" | "salah"
  const list = tab === "morning" ? MORNING_ADHKAR : EVENING_ADHKAR;

  // checks keyed by date so they reset automatically every day
  const today = todayKey();
  const dayChecks = (adhkarProgress && adhkarProgress[today]) || {};
  const done = new Set(dayChecks[tab] || []);
  const daySalah = (salahProgress && salahProgress[today]) || {};
  const salahDone = PRAYERS.filter((p) => daySalah[p]).length;

  const toggle = (id) => {
    if (settings.vibration) vibrate(10);
    if (settings.sound) playTapSound(settings.soundType);
    setAdhkarProgress((prev) => {
      const base = (prev && prev[today]) || {};
      const forTab = new Set(base[tab] || []);
      if (forTab.has(id)) forTab.delete(id);
      else forTab.add(id);
      return { ...prev, [today]: { ...base, [tab]: Array.from(forTab) } };
    });
  };

  const toggleSalah = (id) => {
    if (settings.vibration) vibrate(10);
    if (settings.sound) playTapSound(settings.soundType);
    setSalahProgress((prev) => {
      const base = (prev && prev[today]) || {};
      return { ...prev, [today]: { ...base, [id]: !base[id] } };
    });
  };

  const completedCount = tab === "salah" ? salahDone : list.filter((it) => done.has(it.id)).length;
  const totalCount = tab === "salah" ? PRAYERS.length : list.length;
  const allDone = completedCount === totalCount && totalCount > 0;

  return (
    <div className="min-h-screen pattern-bg safe-top pb-10 -ms-[var(--nav-gutter)] [--bg-bleed:0px]">
      <div className="max-w-[330px] ms-auto me-4 px-4">
        <ScreenHeader title={t.dailyAdhkar} onBack={onBack} t={t} />

        {/* Morning / Evening / Salah tabs */}
        <div className="flex gap-2 mb-4">
          {[
            ["morning", t.morningAdhkar, "sun"],
            ["evening", t.eveningAdhkar, "moon"],
            ["salah", t.salahCheckIn, "check"]
          ].map(([key, label, icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1 border transition-colors ${
                tab === key
                  ? "bg-[var(--terra-dark)] text-white border-[var(--terra-dark)]"
                  : "bg-white/70 dark:bg-white/5 border-[var(--beige)]/70 dark:border-white/10 text-[var(--brown-700)] dark:text-[var(--dark-muted)]"
              }`}
            >
              <Icon name={icon} size={13} /> {label}
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-[var(--brown-500)] dark:text-[var(--dark-muted)]">
              {completedCount}/{totalCount} {t.adhkarDone}
            </p>
            <p className="text-xs font-semibold text-[var(--terra-dark)] dark:text-[var(--gold)]">
              {Math.round((completedCount / totalCount) * 100)}%
            </p>
          </div>
          <div className="h-2 rounded-full bg-[var(--beige)] dark:bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--terra-dark)] transition-all duration-300"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {allDone && (
          <div className="rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-4 py-3 mb-4 text-center">
            <p className="text-sm font-medium text-green-700 dark:text-green-400">🌿 {t.adhkarAllDone}</p>
          </div>
        )}

        {tab === "salah" ? (
          /* Salah check-in list */
          <div className="space-y-2.5">
            {PRAYERS.map((p) => {
              const isDone = !!daySalah[p];
              return (
                <button
                  key={p}
                  onClick={() => toggleSalah(p)}
                  className={`w-full rounded-2xl border px-4 py-4 flex items-center justify-between transition-all active:scale-[0.98] ${
                    isDone
                      ? "bg-[var(--terra-dark)]/5 dark:bg-[var(--gold)]/5 border-[var(--terra-dark)]/30 dark:border-[var(--gold)]/30"
                      : "bg-white/70 dark:bg-white/5 border-[var(--beige)]/70 dark:border-white/10"
                  }`}
                >
                  <span
                    className={`text-sm font-semibold ${isDone ? "text-[var(--terra-dark)] dark:text-[var(--gold)]" : "text-[var(--brown-900)] dark:text-[var(--dark-text)]"}`}
                  >
                    {t[p]}
                  </span>
                  <span
                    className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isDone
                        ? "bg-[var(--terra-dark)] border-[var(--terra-dark)] text-white"
                        : "border-[var(--beige)] dark:border-white/20 text-transparent"
                    }`}
                  >
                    <Icon name="check" size={12} />
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          /* Adhkar list */
          <div className="space-y-2.5">
          {list.map((item) => {
            const isDone = done.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                className={`w-full text-right rounded-2xl border px-4 py-3.5 text-right transition-all active:scale-[0.98] ${
                  isDone
                    ? "bg-[var(--terra-dark)]/5 dark:bg-[var(--gold)]/5 border-[var(--terra-dark)]/30 dark:border-[var(--gold)]/30"
                    : "bg-white/70 dark:bg-white/5 border-[var(--beige)]/70 dark:border-white/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-arabic text-[1.3125rem] leading-relaxed ${
                        isDone
                          ? "text-[var(--brown-500)] dark:text-[var(--dark-muted)] line-through decoration-1"
                          : "text-[var(--brown-900)] dark:text-[var(--dark-text)]"
                      }`}
                    >
                      {item.arabic}
                    </p>
                    <p className="text-sm font-medium text-[var(--terra-dark)] dark:text-[var(--gold)] mt-1">
                      {item.transliteration}
                      <span className="text-xs text-[var(--brown-500)] dark:text-[var(--dark-muted)] font-normal"> · {item.count}{t.times}</span>
                    </p>
                    <p className="text-xs text-[var(--brown-500)]/80 dark:text-[var(--dark-muted)]/80 mt-0.5">{item.note}</p>
                  </div>
                  <span
                    className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-1 transition-colors ${
                      isDone
                        ? "bg-[var(--terra-dark)] border-[var(--terra-dark)] text-white"
                        : "border-[var(--beige)] dark:border-white/20 text-transparent"
                    }`}
                  >
                    <Icon name="check" size={12} />
                  </span>
                </div>
              </button>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}