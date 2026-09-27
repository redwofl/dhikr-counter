import ScreenHeader from "./ScreenHeader.jsx";
import Icon from "../lib/Icon.jsx";
import { todayKey } from "../lib/storage.js";
import { computeLifetimeStats } from "../lib/achievements.js";
import { effectiveMaxFor } from "../lib/counterLogic.js";

const WEEKS = 16;
const DAY_MS = 24 * 60 * 60 * 1000;
const dateKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function Heatmap({ dailyStats, dailyGoal, t }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build a grid of WEEKS columns x 7 rows, aligned to weeks starting on Sunday
  const start = new Date(today);
  start.setDate(start.getDate() - (WEEKS - 1) * 7 - start.getDay());

  const weeks = [];
  for (let w = 0; w < WEEKS; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + w * 7 + d);
      const key = dateKey(date);
      const reps = dailyStats[key] ? dailyStats[key].repetitions : 0;
      const future = date > today;
      // intensity relative to daily goal
      const ratio = dailyGoal > 0 ? reps / dailyGoal : 0;
      const level =
        reps === 0 ? 0 :
        ratio < 0.33 ? 1 :
        ratio < 0.66 ? 2 :
        ratio < 1 ? 3 : 4;
      days.push({ key, reps, level, future, isToday: key === dateKey(today) });
    }
    weeks.push(days);
  }

  const cellColor = (level) => {
    if (level === 0) return "var(--beige)";
    if (level === 1) return "var(--terra-dark)33";
    if (level === 2) return "var(--terra-dark)55";
    if (level === 3) return "var(--terra-dark)99";
    return "var(--terra-dark)";
  };

  return (
    <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 p-4 mb-6">
      <div className="flex gap-[3px] overflow-hidden">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px] flex-1">
            {week.map((day) => (
              <div
                key={day.key}
                title={`${day.key}: ${day.reps} ${t.reps}`}
                className={`w-full aspect-square rounded-[3px] transition-colors ${
                  day.future ? "opacity-0" : ""
                } ${day.isToday ? "ring-1 ring-[var(--terra-dark)] ring-offset-1" : ""}`}
                style={{ backgroundColor: day.future ? "transparent" : cellColor(day.level) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 mt-2.5">
        <span className="text-[10px] text-[var(--brown-500)] dark:text-[var(--dark-muted)]">{t.less}</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className="w-2.5 h-2.5 rounded-[3px]" style={{ backgroundColor: cellColor(l) }} />
        ))}
        <span className="text-[10px] text-[var(--brown-500)] dark:text-[var(--dark-muted)]">{t.more}</span>
      </div>
    </div>
  );
}

export default function ProgressPage({ dailyStats, session, template, t, onBack, onAchievements, dailyGoal }) {
  const today = dailyStats[todayKey()] || { repetitions: 0, sessions: 0 };
  const activeItem =
    session && template && !session.completed && template.items[session.currentItemIndex]
      ? template.items[session.currentItemIndex]
      : null;
  const activeEffMax = activeItem ? effectiveMaxFor(session, activeItem) : 0;
  const dates = Object.keys(dailyStats).sort().reverse().slice(0, 14);
  return (
    <div className="min-h-screen pattern-bg safe-top pb-10 -ms-[var(--nav-gutter)] [--bg-bleed:0px]">
      <div className="max-w-[300px] ms-auto me-4 px-4">
        <ScreenHeader title={t.progress} onBack={onBack} t={t} />
        <p className="text-xs uppercase tracking-wide text-[var(--brown-500)] dark:text-[var(--dark-muted)] mb-2">{t.activity} · {t.lastWeeks}</p>
        <Heatmap dailyStats={dailyStats} dailyGoal={dailyGoal} t={t} />

        {/* Lifetime totals */}
        <p className="text-xs uppercase tracking-wide text-[var(--brown-500)] dark:text-[var(--dark-muted)] mb-2">{t.lifetimeStats}</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 p-3 text-center">
            <p className="text-xl font-display font-semibold text-[var(--terra-dark)] dark:text-[var(--gold)]">
              {computeLifetimeStats(dailyStats).totalReps.toLocaleString()}
            </p>
            <p className="text-[10px] text-[var(--brown-500)] dark:text-[var(--dark-muted)] leading-tight mt-0.5">{t.totalReps}</p>
          </div>
          <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 p-3 text-center">
            <p className="text-xl font-display font-semibold text-[var(--terra-dark)] dark:text-[var(--gold)]">
              {computeLifetimeStats(dailyStats).totalSessions.toLocaleString()}
            </p>
            <p className="text-[10px] text-[var(--brown-500)] dark:text-[var(--dark-muted)] leading-tight mt-0.5">{t.totalSessions}</p>
          </div>
          <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 p-3 text-center">
            <p className="text-xl font-display font-semibold text-[var(--terra-dark)] dark:text-[var(--gold)]">
              {computeLifetimeStats(dailyStats).activeDays.toLocaleString()}
            </p>
            <p className="text-[10px] text-[var(--brown-500)] dark:text-[var(--dark-muted)] leading-tight mt-0.5">{t.activeDays}</p>
          </div>
        </div>

        {/* Achievements link */}
        <button
          onClick={onAchievements}
          className="w-full rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 px-4 py-3.5 mb-6 flex items-center justify-between active:scale-[0.98] transition-transform"
        >
          <span className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[var(--terra)]/15 flex items-center justify-center text-[var(--terra-dark)] dark:text-[var(--gold)]">
              <Icon name="trophy" size={18} />
            </span>
            <span className="text-sm font-medium text-[var(--brown-900)] dark:text-[var(--dark-text)]">{t.achievements}</span>
          </span>
          <Icon name="chevronRight" size={16} className="text-[var(--brown-400)] dark:text-[var(--dark-muted)]" />
        </button>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 p-4">
            <p className="text-3xl font-display font-semibold text-[var(--terra-dark)] dark:text-[var(--gold)]">{today.repetitions}</p>
            <p className="text-xs text-[var(--brown-500)] dark:text-[var(--dark-muted)]">{t.todaysRepetitions}</p>
          </div>
          <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 p-4">
            <p className="text-3xl font-display font-semibold text-[var(--terra-dark)] dark:text-[var(--gold)]">{today.sessions}</p>
            <p className="text-xs text-[var(--brown-500)] dark:text-[var(--dark-muted)]">{t.todaysSessions}</p>
          </div>
        </div>
        {activeItem && (
          <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 p-4 mb-6">
            <p className="text-xs uppercase tracking-wide text-[var(--brown-500)] dark:text-[var(--dark-muted)] mb-1">{t.currentSession}</p>
            <p className="font-display text-lg text-[var(--brown-900)] dark:text-[var(--dark-text)]">{activeItem.transliteration}</p>
            <p className="text-[var(--terra-dark)] dark:text-[var(--gold)] font-semibold">
              {session.currentCount} / {activeEffMax}
            </p>
          </div>
        )}
        <p className="text-xs uppercase tracking-wide text-[var(--brown-500)] dark:text-[var(--dark-muted)] mb-2">{t.recentDays}</p>
        {dates.length === 0 ? (
          <p className="text-sm text-[var(--brown-500)] dark:text-[var(--dark-muted)]">{t.noProgressYet}</p>
        ) : (
          <div className="space-y-2">
            {dates.map((d) => (
              <div key={d} className="flex items-center justify-between rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 px-4 py-2.5">
                <span className="text-sm text-[var(--brown-700)] dark:text-[var(--dark-muted)]">{d}</span>
                <span className="text-sm font-medium text-[var(--brown-900)] dark:text-[var(--dark-text)]">
                  {dailyStats[d].repetitions} {t.reps}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
