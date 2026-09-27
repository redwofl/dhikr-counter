/**
 * Pure goal-tracking logic, kept separate from React/UI so it can be unit
 * tested without rendering anything (same pattern as counterLogic.js).
 *
 * All functions are side-effect free.
 */

import { todayKey } from "./storage.js";

/**
 * Returns the number of repetitions completed for a given day key.
 */
export function getDayRepetitions(state, dayKey) {
  const day = state && state.dailyStats && state.dailyStats[dayKey];
  return (day && day.repetitions) || 0;
}

/**
 * Returns the number of repetitions completed today.
 */
export function getTodayRepetitions(state) {
  return getDayRepetitions(state, todayKey());
}

/**
 * Returns true when today's repetitions have met or exceeded the daily goal.
 */
export function isTodayGoalComplete(state, goal) {
  return getTodayRepetitions(state) >= goal;
}

/**
 * Converts a "YYYY-MM-DD" key into a Date, then back to a key shifted by
 * `offset` days (negative = earlier). Used for walking backwards through days.
 */
function shiftDateKey(key, offset) {
  const parts = key.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Walks backwards from *today* counting consecutive completed days.
 * Stops at the first uncompleted day (or gap).
 */
export function currentStreak(state, goal) {
  let streak = 0;
  let check = todayKey();

  // If today isn't done, start checking from yesterday
  if (getDayRepetitions(state, check) < goal) {
    check = shiftDateKey(check, -1);
  }

  while (getDayRepetitions(state, check) >= goal) {
    streak++;
    check = shiftDateKey(check, -1);
  }

  return streak;
}

/**
 * Scans all recorded days to find the longest run of consecutive completed
 * days (best streak, ever).
 */
export function bestStreak(state, goal) {
  const dates = Object.keys((state && state.dailyStats) || {}).sort();
  let best = 0;
  let running = 0;
  let prevDay = null;

  for (const date of dates) {
    if (getDayRepetitions(state, date) < goal) {
      running = 0;
      prevDay = null;
      continue;
    }
    // Compare calendar days, not adjacent keys. A day with no record at all is
    // simply absent from dailyStats, so Mon + Wed (no Tuesday) used to count as
    // a run of 2 even though a whole day had been skipped.
    // Parsed as UTC midnight so a DST boundary can't shift the difference.
    const day = Date.parse(date + "T00:00:00Z");
    running = prevDay !== null && day - prevDay === 86400000 ? running + 1 : 1;
    prevDay = day;
    if (running > best) best = running;
  }

  return best;
}

/**
 * Convenience: returns { current, best } for a given goal.
 */
export function computeStreak(state, goal) {
  return { current: currentStreak(state, goal), best: bestStreak(state, goal) };
}

/**
 * Returns the number of reps remaining to hit today's goal (clamped to 0).
 */
export function remainingToGoal(state, goal) {
  return Math.max(0, goal - getTodayRepetitions(state));
}

/**
 * Validates a goal value: integer between 1 and 10000.
 */
export function isValidGoal(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 10000;
}