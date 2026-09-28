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
 * Vertical nav rail: a fixed 64px column of icon-only buttons floating on the
 * page (no card behind them).
 *
 * This used to be an *expandable* rail whose second state grew it to
 * `w-[46%] max-w-[280px]` and showed text labels beside each icon. That state
 * was unreachable: the only control that could set it was a collapse chevron
 * rendered only `{expanded && ...}`, so the expand button was its own
 * precondition and nothing could ever open the rail. The whole expanded branch
 * was dead code.
 *
 * It was removed rather than revived because it could not have worked as
 * written. `--nav-gutter` is a fixed `5rem` and every page cancels it out with
 * `-ms-[var(--nav-gutter)]` so the page spans the full screen width; nothing
 * widens the gutter on expand. Measured on the counter page, a 190px expanded
 * rail covered 11 of 11 text elements. Making it usable would have meant either
 * a slide-over panel with a backdrop or shrinking page content to ~120px, both
 * visible design changes, so the branch went instead.
 *
 * Every item keeps an `aria-label` (from `t`), so the rail stays usable with a
 * screen reader even though it shows no text.
 */
export default function NavRail({ items, activeView, onNavigate, todayReps, dailyGoal, timerRunning, onTimer, timerAvailable, minimal, t }) {
  // Clean mode: only Home stays, so the counter screen can be used distraction
  // free. Tapping Home again brings the rest of the rail back (see `navIntent`).
  const visibleItems = minimal ? items.slice(0, 1) : items;
  const showFooter = !minimal;
  return (
    <nav
      aria-label={t?.mainNav || "Main navigation"}
      className="absolute start-3 z-40 flex flex-col w-16 overflow-visible"
      style={{
        // Keep the rail below the status bar / display cutout and above the
        // bottom nav bar — otherwise the top-most icon (Home) sits under the
        // system status bar and its taps never reach the app.
        //
        // --sa-top/--sa-bottom are set to `env(safe-area-inset-*)` in index.css
        // and then overwritten by MainActivity with the real measured insets.
        // env() alone reports 0 on Android: the window is edge-to-edge, and
        // WebView derives safe-area from the display cutout, not the status bar.
        //
        // The 96px top gap (originally 12px) drops the rail well clear of the
        // status bar and the page header row the other screens draw at y=24.
        // On a 412x924 screen the Home icon now starts at y=108 instead of
        // y=24, and the lowest rail element (the Auto Counter button) finishes
        // at y=499 — about 425px above the bottom edge, so the goal ring and the
        // timer stay on screen.
        //
        // 96px was picked by measuring the range, not by eye. Offsets from 32px
        // to 128px were applied to the live rail on the counter, adhkar and
        // settings screens: no offset in that range clips any icon, and the
        // count of page elements sitting under the rail's x-range does not vary
        // with the offset (it is 11 on the counter at every value, because that
        // screen centres its content across the full width rather than beside
        // the rail). So the only real limits are staying under the status bar
        // and keeping the bottom group visible, and 96px sits comfortably
        // inside both.
        top: "calc(var(--sa-top, 0px) + 96px)",
        bottom: "calc(var(--sa-bottom, 0px) + 12px)"
      }}
    >
      {/* nav items */}
      <div className="flex-1 flex flex-col py-3 items-center gap-2">
        {visibleItems.map((it) => {
          const active = activeView === it.view;
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
        <div className="pt-2 mt-1.5 border-t border-black/10 dark:border-white/10 flex flex-col items-center gap-2">
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
