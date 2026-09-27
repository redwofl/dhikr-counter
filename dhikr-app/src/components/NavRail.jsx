import Icon from "../lib/Icon.jsx";

/** Small circular daily-goal progress ring (percentage) */
function GoalRing({ todayReps, dailyGoal }) {
  const progress = dailyGoal > 0 ? Math.min(todayReps / dailyGoal, 1) : 0;
  const r = 15;
  const c = 2 * Math.PI * r;
  const pct = Math.round(progress * 100);
  return (
    <div className="relative w-10 h-10" title={`${todayReps} / ${dailyGoal}`}>
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="var(--beige)" strokeWidth="3.5" className="dark:opacity-20" opacity="0.8" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="var(--terra-dark)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          transform="rotate(-90 20 20)"
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums text-[var(--terra-dark)] dark:text-[var(--gold)]">
        {pct}%
      </span>
    </div>
  );
}

/**
 * Expandable vertical nav rail (no card background — icons only).
 *
 * Collapsed: icon-only buttons floating on the page (no pill/card behind
 * them), same positions/sizes as before. Expanded: the rail still grows
 * to roughly half the screen width and each item shows its label, but
 * without a solid panel — labels render directly on the page background.
 */
export default function NavRail({ items, activeView, expanded, onToggle, onNavigate, todayReps, dailyGoal, timerRunning, onTimer, timerAvailable, minimal, t }) {
  // clean mode: collapsed rail shows only the home icon
  const visibleItems = minimal && !expanded ? items.slice(0, 1) : items;
  const showFooter = !(minimal && !expanded);
  return (
    <nav
      aria-label={t?.mainNav || "Main navigation"}
      className={`absolute start-3 z-40 flex flex-col overflow-visible transition-all duration-300 ease-in-out ${
        expanded ? "w-[46%] max-w-[280px]" : "w-16"
      }`}
      style={{
        // Keep the rail below the status bar / display cutout and above the
        // bottom nav bar — otherwise the top-most icon (Home) sits under the
        // system status bar and its taps never reach the app.
        //
        // --sa-top/--sa-bottom are set to `env(safe-area-inset-*)` in index.css
        // and then overwritten by MainActivity with the real measured insets.
        // env() alone reports 0 on Android: the window is edge-to-edge, and
        // WebView derives safe-area from the display cutout, not the status bar.
        top: "calc(var(--sa-top, 0px) + 12px)",
        bottom: "calc(var(--sa-bottom, 0px) + 12px)"
      }}
    >
      {/* collapse chevron (no logo — it duplicated the Daily Adhkar icon) */}
      {expanded && (
        <div className="flex justify-end px-3 pt-4 pb-2">
          <button
            aria-label={t?.collapse || "Collapse"}
            onClick={onToggle}
            className="nav-glass w-8 h-8 rounded-full text-[var(--ivory)] flex items-center justify-center active:scale-90"
          >
            <Icon name="chevronRight" size={14} className="rotate-180" />
          </button>
        </div>
      )}

      {/* nav items */}
      <div className={`flex-1 flex flex-col py-3 ${expanded ? "items-stretch gap-1.5 px-2" : "items-center gap-2"}`}>
        {visibleItems.map((it) => {
          const active = activeView === it.view;
          if (expanded) {
            return (
              <button
                key={it.view}
                aria-label={it.label}
                aria-current={active ? "page" : undefined}
                onClick={() => onNavigate(it.view)}
                className={`flex items-center gap-3 rounded-full px-2 py-1.5 transition-colors ${
                  active
                    ? "bg-[#C79A4B]/15"
                    : "hover:bg-white/50 dark:hover:bg-white/5 active:bg-white/70"
                }`}
              >
                <span
                  className={`nav-glass w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    active ? "nav-glass-active text-[var(--gold)]" : "text-[var(--ivory)]"
                  }`}
                >
                  <Icon name={it.icon} size={20} />
                </span>
                <span
                  className={`text-sm font-semibold whitespace-nowrap ${
                    active ? "text-[var(--gold)] dark:text-[var(--gold)]" : "text-[#8C7355] dark:text-[#B9A484]"
                  }`}
                >
                  {it.label}
                </span>
              </button>
            );
          }
          return (
            <button
              key={it.view}
              aria-label={it.label}
              aria-current={active ? "page" : undefined}
              onClick={() => onNavigate(it.view)}
              className={`nav-glass w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                active ? "nav-glass-active text-[var(--gold)]" : "text-[var(--ivory)] active:scale-90"
              }`}
            >
              <Icon name={it.icon} size={21} />
            </button>
          );
        })}

        {/* goal ring + timer, below the nav items */}
        {showFooter && (
        <div
          className={`pt-2 mt-1.5 border-t border-black/10 dark:border-white/10 ${
            expanded ? "px-2 flex items-center gap-3" : "flex flex-col items-center gap-2"
          }`}
        >
          <GoalRing todayReps={todayReps} dailyGoal={dailyGoal} />
          {/* The Auto Counter launcher only makes sense while there is an
              active, unfinished counter session; otherwise it is hidden so a
              tap can never fire a stale/no-op timer press on other tabs. */}
          {timerAvailable && (
            <button
              aria-label={timerRunning ? t?.stop || "Stop" : t?.autoCounter || "Auto Counter"}
              onClick={onTimer}
              className={`nav-glass w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                timerRunning
                  ? "nav-glass-active text-[var(--gold)]"
                  : "text-[var(--ivory)] active:scale-90"
              }`}
            >
              <Icon name={timerRunning ? "stop" : "timer"} size={21} />
            </button>
          )}
        </div>
        )}
      </div>
    </nav>
  );
}
