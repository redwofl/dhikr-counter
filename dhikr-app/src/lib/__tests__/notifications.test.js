import { describe, it, expect } from "vitest";
import {
  normalizeReminderTime,
  nextDailyAt,
  nextWeeklyAt,
  isWeekScheduled,
  weekKeyOf,
  weekStats,
  weeklyBody,
  weeklySummaryAction
} from "../notifications.js";

const at = (y, m, d, h = 0, min = 0) => new Date(y, m - 1, d, h, min, 0, 0);

describe("normalizeReminderTime", () => {
  it("parses valid HH:MM strings", () => {
    expect(normalizeReminderTime("08:30")).toEqual({ hours: 8, minutes: 30 });
    expect(normalizeReminderTime("23:59")).toEqual({ hours: 23, minutes: 59 });
    expect(normalizeReminderTime("0:05")).toEqual({ hours: 0, minutes: 5 });
  });

  it("falls back to 08:00 for missing or malformed values", () => {
    expect(normalizeReminderTime(undefined)).toEqual({ hours: 8, minutes: 0 });
    expect(normalizeReminderTime("")).toEqual({ hours: 8, minutes: 0 });
    expect(normalizeReminderTime("99:99")).toEqual({ hours: 8, minutes: 0 });
    expect(normalizeReminderTime("8:5")).toEqual({ hours: 8, minutes: 0 });
    expect(normalizeReminderTime("noon")).toEqual({ hours: 8, minutes: 0 });
  });
});

describe("nextDailyAt", () => {
  it("returns today when the time is still ahead", () => {
    const now = at(2026, 9, 17, 7, 0);
    const next = nextDailyAt(now, "08:00");
    expect(next.getDate()).toBe(17);
    expect(next.getHours()).toBe(8);
  });

  it("returns tomorrow when today's occurrence just passed", () => {
    const now = at(2026, 9, 17, 8, 0); // same minute as the reminder
    const next = nextDailyAt(now, "08:00");
    expect(next.getDate()).toBe(18);
  });

  it("lands exactly on the requested minute, seconds zeroed", () => {
    const now = at(2026, 9, 17, 8, 0, 1);
    const next = nextDailyAt(new Date(now.getTime() + 1000), "07:59");
    expect(next.getHours()).toBe(7);
    expect(next.getMinutes()).toBe(59);
    expect(next.getSeconds()).toBe(0);
    expect(next.getDate()).toBe(18); // 07:59 already passed that morning
  });

  it("defaults to 08:00 when the setting is corrupt", () => {
    const now = at(2026, 9, 17, 9, 0);
    const next = nextDailyAt(now, "not-a-time");
    expect(next.getHours()).toBe(8);
    expect(next.getDate()).toBe(18);
  });
});

describe("nextWeeklyAt", () => {
  it("returns this week's Monday when still ahead", () => {
    // 2026-09-17 is a Thursday: Thursday 08:00 is already past this week's
    // Monday 09:00 slot, so the next occurrence is *next* Monday.
    const now = at(2026, 9, 17, 8, 0);
    const next = nextWeeklyAt(now);
    expect(next.getDay()).toBe(1); // Monday
    expect(next.getDate()).toBe(21);
    expect(next.getHours()).toBe(9);
  });

  it("returns this week's Monday when the slot is still ahead", () => {
    // Monday 08:00 — the 09:00 slot of the same Monday is still future.
    const now = at(2026, 9, 14, 8, 0);
    const next = nextWeeklyAt(now);
    expect(next.getDate()).toBe(14);
  });

  it("rolls to next Monday when this week's slot passed", () => {
    const now = at(2026, 9, 14, 10, 0); // Monday, after 09:00
    const next = nextWeeklyAt(now);
    expect(next.getDate()).toBe(21);
  });

  it("treats the exact slot time as passed", () => {
    const now = at(2026, 9, 14, 9, 0); // Monday 09:00 sharp
    const next = nextWeeklyAt(now);
    expect(next.getDate()).toBe(21);
  });

  it("supports a custom weekday (Friday = 4)", () => {
    const now = at(2026, 9, 17, 12, 0); // Thursday
    const next = nextWeeklyAt(now, 4, 18, 30);
    expect(next.getDay()).toBe(5);
    expect(next.getHours()).toBe(18);
    expect(next.getMinutes()).toBe(30);
  });
});

describe("weekKeyOf", () => {
  it("maps any day to its Monday key", () => {
    expect(weekKeyOf(at(2026, 9, 17))).toBe("2026-09-14"); // Thu → Mon
    expect(weekKeyOf(at(2026, 9, 14))).toBe("2026-09-14"); // Mon → Mon
    expect(weekKeyOf(at(2026, 9, 13))).toBe("2026-09-07"); // Sun → prev Mon
    expect(weekKeyOf(at(2026, 1, 1))).toBe("2025-12-29"); // year boundary
  });
});

describe("weekStats", () => {
  it("sums this week to date — Monday up to and including today", () => {
    // 2026-09-17 is a Thursday, so the week is Mon 14 → Sun 20.
    const stats = {
      "2026-09-14": { repetitions: 100, sessions: 2 },
      "2026-09-16": { repetitions: 50, sessions: 1 },
      "2026-09-17": { repetitions: 10, sessions: 1 }, // today — included
      "2026-09-18": { repetitions: 999, sessions: 9 }, // later this week — not yet
      "2026-09-12": { repetitions: 500, sessions: 5 } // last week — excluded
    };
    const s = weekStats(stats, at(2026, 9, 17));
    expect(s).toEqual({ repetitions: 160, activeDays: 3 });
  });

  it("does not reach back into the previous week on a Monday", () => {
    // The old rolling 7-day window summed Thu–Sun of the *previous* week here.
    const stats = {
      "2026-09-10": { repetitions: 100 }, // Thu, previous week
      "2026-09-11": { repetitions: 100 }, // Fri, previous week
      "2026-09-12": { repetitions: 100 }, // Sat, previous week
      "2026-09-13": { repetitions: 100 }, // Sun, previous week
      "2026-09-14": { repetitions: 7 } // Mon, this week
    };
    expect(weekStats(stats, at(2026, 9, 14, 10, 0))).toEqual({ repetitions: 7, activeDays: 1 });
  });

  it("includes Sunday when asked on a Sunday", () => {
    // 2026-09-13 is a Sunday: the week is Mon 7 → Sun 13, and the last day of
    // the week is the one being counted.
    const stats = { "2026-09-13": { repetitions: 42 } };
    expect(weekStats(stats, at(2026, 9, 13, 22, 0))).toEqual({ repetitions: 42, activeDays: 1 });
  });

  it("ignores inactive days and missing maps", () => {
    const stats = {
      "2026-09-16": { repetitions: 0 }, // inactive — not an active day
      "2026-09-15": { repetitions: 0 }
    };
    expect(weekStats(stats, at(2026, 9, 17, 9, 0))).toEqual({ repetitions: 0, activeDays: 0 });
    expect(weekStats(undefined, at(2026, 9, 17))).toEqual({ repetitions: 0, activeDays: 0 });
  });

  it("counts each day of a week exactly once across a month boundary", () => {
    // Week of Mon 2026-08-31 → Sun 2026-09-06 straddles the month change.
    const stats = {
      "2026-08-31": { repetitions: 3 },
      "2026-09-01": { repetitions: 3 },
      "2026-09-02": { repetitions: 3 },
      "2026-09-03": { repetitions: 3 },
      "2026-09-04": { repetitions: 3 },
      "2026-09-05": { repetitions: 3 },
      "2026-09-06": { repetitions: 3 }
    };
    expect(weekStats(stats, at(2026, 9, 6, 23, 0))).toEqual({ repetitions: 21, activeDays: 7 });
  });
});

describe("weeklyBody", () => {
  it("interpolates reps, days and streak", () => {
    const tpl = "This week: {reps} dhikr across {days} day(s) — Streak: {streak} 🔥";
    expect(weeklyBody(tpl, { repetitions: 1200, activeDays: 5, streak: 3 })).toBe(
      "This week: 1200 dhikr across 5 day(s) — Streak: 3 🔥"
    );
  });

  it("returns an empty string when the template is missing", () => {
    expect(weeklyBody(undefined, { repetitions: 1, activeDays: 1, streak: 1 })).toBe("");
  });
});

describe("weeklySummaryAction", () => {
  const stats = { repetitions: 300, activeDays: 2 };

  it("cancels the pending notification when disabled", () => {
    expect(weeklySummaryAction(false, [], "2026-09-14", stats)).toEqual({ action: "cancel" });
  });

  it("skips when the week was already scheduled", () => {
    expect(weeklySummaryAction(true, ["2026-09-14"], "2026-09-14", stats)).toEqual({ action: "skip" });
  });

  it("schedules when the week has content and is unscheduled", () => {
    expect(weeklySummaryAction(true, [], "2026-09-14", stats)).toEqual({ action: "schedule" });
  });

  it("marks empty weeks handled without scheduling a notification", () => {
    expect(weeklySummaryAction(true, [], "2026-09-14", { repetitions: 0, activeDays: 0 })).toEqual({
      action: "markOnly"
    });
  });
});

describe("isWeekScheduled", () => {
  it("matches only the exact week key", () => {
    expect(isWeekScheduled("2026-09-14", "2026-09-14")).toBe(true);
    expect(isWeekScheduled("2026-09-14", "2026-09-21")).toBe(false);
    expect(isWeekScheduled(undefined, "2026-09-14")).toBe(false);
  });
});
