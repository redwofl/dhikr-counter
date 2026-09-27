// Pure notification-scheduling logic — no React, no Capacitor imports, so it
// can be unit tested and reused by any future scheduler UI.
//
// Why one-shot `at` schedules instead of `repeats: true`:
//   The Capacitor Android plugin computes the repeat interval as
//   `at.getTime() - now` at schedule time (LocalNotificationManager.java), so
//   a "daily 08:00" reminder armed at 08:00:30 would re-fire every 24h from
//   that arbitrary arming moment and drift later with every relaunch. The
//   cron-like `on: { hour, minute }` schedule is an alternative, but its
//   DateMatch.nextTrigger() rolls forward *per unit* — an `on` match whose
//   first (least significant) non-null field is `hour` re-fires every hour.
//   Instead we schedule a single `at` notification and re-arm it every time
//   the app opens, which also keeps the body content (weekly stats) fresh.

/**
 * Hours/minutes of a scheduled reminder, as "HH:MM" (defaults 08:00).
 */
export function normalizeReminderTime(reminderTime) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(reminderTime || ""));
  if (!match) return { hours: 8, minutes: 0 };
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return { hours: 8, minutes: 0 };
  return { hours, minutes };
}

/**
 * The next Date at which a daily reminder should fire on the device's local
 * wall clock. If today's occurrence is already past (even by one second),
 * the next day is returned, so re-arming on app open never fires a stale
 * notification and always lands on the intended wall-clock time.
 */
export function nextDailyAt(now, reminderTime) {
  const { hours, minutes } = normalizeReminderTime(reminderTime);
  const d = new Date(now);
  d.setHours(hours, minutes, 0, 0);
  if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
  return d;
}

/**
 * The next Date at which a weekly summary should fire (Mondays 09:00 local by
 * default). Days are indexed Monday=0 … Sunday=6 to keep the mapping obvious.
 */
export function nextWeeklyAt(now, weekday = 0, hours = 9, minutes = 0) {
  const d = new Date(now);
  d.setHours(hours, minutes, 0, 0);
  const current = (d.getDay() + 6) % 7; // Monday=0 … Sunday=6
  let delta = (weekday - current + 7) % 7;
  if (delta === 0 && d.getTime() <= now.getTime()) delta = 7;
  d.setDate(d.getDate() + delta);
  return d;
}

/**
 * True when the given week (a Monday "YYYY-MM-DD" key, see weekKeyOf) has
 * already had its summary scheduled.
 */
export function isWeekScheduled(scheduledWeek, weekKey) {
  return scheduledWeek === weekKey;
}

/**
 * The Monday-key "YYYY-MM-DD" of the week containing `now`.
 */
export function weekKeyOf(now) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Aggregates the 7 days *before* `now`'s day (exclusive of today), so a
 * summary scheduled early in the week reports on the completed week.
 */
export function weekStats(dailyStats, now) {
  let repetitions = 0;
  let activeDays = 0;
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const day = dailyStats && dailyStats[key];
    if (day && day.repetitions > 0) {
      repetitions += day.repetitions;
      activeDays += 1;
    }
  }
  return { repetitions, activeDays };
}

/**
 * Fills {reps}/{days}/{streak} placeholders. Mirrors the app's other
 * call sites, which interpolate with .replace() (first occurrence only).
 */
export function weeklyBody(template, { repetitions, activeDays, streak }) {
  return String(template || "")
    .replace("{reps}", repetitions)
    .replace("{days}", activeDays)
    .replace("{streak}", streak);
}

/**
 * Decides whether a weekly summary should be scheduled for `weekKey`
 * ("YYYY-MM-DD" of the week's Monday):
 *   - enabled + not yet scheduled + the week has content → true
 *   - enabled + no content in the finished week → false, but the week is
 *     still returned as "handled" so we don't re-evaluate all week long
 *   - disabled → cancels: the pending notification id is cleared
 */
export function weeklySummaryAction(enabled, scheduledWeeks, weekKey, stats) {
  if (!enabled) return { action: "cancel" };
  if (scheduledWeeks.includes(weekKey)) return { action: "skip" };
  if (stats.repetitions === 0) return { action: "markOnly" };
  return { action: "schedule" };
}
