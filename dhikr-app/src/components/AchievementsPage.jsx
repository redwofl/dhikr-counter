import Icon from "../lib/Icon.jsx";
import ScreenHeader from "./ScreenHeader.jsx";
import { computeAchievements } from "../lib/achievements.js";

export default function AchievementsPage({ state, t, onBack }) {
  const badges = computeAchievements(state);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="min-h-screen pattern-bg safe-top pb-10 -ms-[var(--nav-gutter)] [--bg-bleed:0px]">
      <div className="max-w-[300px] ms-auto me-4 px-4">
        <ScreenHeader title={t.achievements} onBack={onBack} t={t} />

        <div className="rounded-2xl bg-white/70 dark:bg-white/5 border border-[var(--beige)]/70 dark:border-white/10 p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--terra)]/15 flex items-center justify-center text-[var(--terra-dark)] dark:text-[var(--gold)]">
            <Icon name="trophy" size={22} />
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-[var(--terra-dark)] dark:text-[var(--gold)]">
              {unlockedCount}/{badges.length}
            </p>
            <p className="text-xs text-[var(--brown-500)] dark:text-[var(--dark-muted)]">{t.achievementsSub}</p>
          </div>
        </div>

        <div className="space-y-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`rounded-2xl border px-4 py-3.5 flex items-center gap-3 transition-all ${
                b.unlocked
                  ? "bg-white/70 dark:bg-white/5 border-[var(--terra-dark)]/30 dark:border-[var(--gold)]/30"
                  : "bg-white/40 dark:bg-white/[0.03] border-[var(--beige)]/60 dark:border-white/10 opacity-75"
              }`}
            >
              <span className={`text-2xl ${b.unlocked ? "" : "grayscale opacity-50"}`}>{b.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--brown-900)] dark:text-[var(--dark-text)]">
                      {t[b.titleKey] || b.title}
</p>
                  {b.unlocked ? (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--terra-dark)] dark:text-[var(--gold)]">
                      {"★".repeat(b.tier)}{"☆".repeat(Math.max(0, b.maxTier - b.tier))}
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wide text-[var(--brown-500)]/60 dark:text-[var(--dark-muted)]/60">{t.locked}</span>
                  )}
                </div>
                {b.next !== null ? (
                  <>
                    <p className="text-xs text-[var(--brown-500)] dark:text-[var(--dark-muted)] mt-0.5">
                      {b.value} / {b.next}
                    </p>
                    <div className="h-1.5 rounded-full bg-[var(--beige)] dark:bg-white/10 mt-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--terra-dark)] dark:bg-[var(--gold)] transition-all duration-300"
                        style={{ width: `${b.progress * 100}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-[var(--terra-dark)] dark:text-[var(--gold)] mt-0.5">★ {b.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}