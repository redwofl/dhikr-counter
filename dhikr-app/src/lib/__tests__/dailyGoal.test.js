import { todayKey, STORAGE_KEY } from "../storage.js";
import {
  getDayRepetitions,
  getTodayRepetitions,
  isTodayGoalComplete,
  currentStreak,
  bestStreak,
  computeStreak,
  remainingToGoal,
  isValidGoal
} from "../dailyGoal.js";

// Helper: build a state with arbitrary dailyStats
function makeState(dailyStats = {}, settings = {}) {
  return { version: 1, customTemplates: [], deletedDefaultIds: [], session: null, settings, introCompleted: true, dailyStats };
}

const TODAY = todayKey();

describe("dailyGoal: getDayRepetitions", () => {
  test("returns repetitions for a recorded day", () => {
    const state = makeState({ "2024-01-01": { repetitions: 42, sessions: 2 } });
    expect(getDayRepetitions(state, "2024-01-01")).toBe(42);
  });

  test("returns 0 for an unrecorded day", () => {
    const state = makeState({});
    expect(getDayRepetitions(state, "2024-01-01")).toBe(0);
  });

  test("returns 0 when dailyStats is empty", () => {
    expect(getDayRepetitions(makeState(), TODAY)).toBe(0);
  });
});

describe("dailyGoal: getTodayRepetitions", () => {
  test("returns today's repetitions", () => {
    const state = makeState({ [TODAY]: { repetitions: 100, sessions: 1 } });
    expect(getTodayRepetitions(state)).toBe(100);
  });

  test("returns 0 when nothing logged today", () => {
    expect(getTodayRepetitions(makeState())).toBe(0);
  });
});

describe("dailyGoal: isTodayGoalComplete", () => {
  test("true when today >= goal", () => {
    const state = makeState({ [TODAY]: { repetitions: 333 } });
    expect(isTodayGoalComplete(state, 333)).toBe(true);
    expect(isTodayGoalComplete(state, 300)).toBe(true);
  });

  test("false when today < goal", () => {
    const state = makeState({ [TODAY]: { repetitions: 50 } });
    expect(isTodayGoalComplete(state, 100)).toBe(false);
  });

  test("false when nothing logged", () => {
    expect(isTodayGoalComplete(makeState(), 1)).toBe(false);
  });
});

describe("dailyGoal: currentStreak", () => {
  test("counts consecutive completed days ending today", () => {
    // Build 3 consecutive days ending today
    const d1 = TODAY; // today
    const d0 = (() => {
      const p = d1.split("-").map(Number);
      const date = new Date(p[0], p[1] - 1, p[2] - 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    })();
    const state = makeState({
      [d0]: { repetitions: 100 },
      [d1]: { repetitions: 100 }
    });
    expect(currentStreak(state, 100)).toBe(2);
  });

  test("stops when a day is incomplete", () => {
    const d1 = TODAY;
    const d0 = (() => {
      const p = d1.split("-").map(Number);
      const date = new Date(p[0], p[1] - 1, p[2] - 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    })();
    const state = makeState({
      [d0]: { repetitions: 10 },  // incomplete
      [d1]: { repetitions: 100 }
    });
    // today is complete but yesterday is not → streak is 1
    expect(currentStreak(state, 100)).toBe(1);
  });

  test("returns 0 when nothing completed", () => {
    expect(currentStreak(makeState(), 1)).toBe(0);
  });
});

describe("dailyGoal: bestStreak", () => {
  test("finds the longest run ever", () => {
    const state = makeState({
      "2024-01-01": { repetitions: 100 },
      "2024-01-02": { repetitions: 100 },
      "2024-01-03": { repetitions: 10 },  // break
      "2024-01-04": { repetitions: 100 },
      "2024-01-05": { repetitions: 100 },
      "2024-01-06": { repetitions: 100 },
      "2024-01-07": { repetitions: 100 }
    });
    expect(bestStreak(state, 100)).toBe(4); // Jan 4–7
  });

  test("returns 0 when no day meets goal", () => {
    const state = makeState({
      "2024-01-01": { repetitions: 10 }
    });
    expect(bestStreak(state, 100)).toBe(0);
  });

  // A day with no record at all is absent from dailyStats, so key order alone
  // used to make non-adjacent dates look like one unbroken run.
  test("does not join runs across a day with no record", () => {
    const state = makeState({
      "2024-01-01": { repetitions: 100 },
      // 2024-01-02 deliberately missing
      "2024-01-03": { repetitions: 100 },
      "2024-01-04": { repetitions: 100 }
    });
    expect(bestStreak(state, 100)).toBe(2); // Jan 3–4, not Jan 1–4
  });

  test("a below-goal day breaks the run", () => {
    const state = makeState({
      "2024-01-01": { repetitions: 100 },
      "2024-01-02": { repetitions: 10 },
      "2024-01-03": { repetitions: 100 }
    });
    expect(bestStreak(state, 100)).toBe(1);
  });
});

describe("dailyGoal: computeStreak", () => {
  test("returns both current and best", () => {
    const d1 = TODAY;
    const d0 = (() => {
      const p = d1.split("-").map(Number);
      const date = new Date(p[0], p[1] - 1, p[2] - 1);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    })();
    const state = makeState({
      [d0]: { repetitions: 100 },
      [d1]: { repetitions: 100 }
    });
    const result = computeStreak(state, 100);
    expect(result.current).toBe(2);
    expect(result.best).toBe(2);
  });
});

describe("dailyGoal: remainingToGoal", () => {
  test("returns remaining reps clamped to 0", () => {
    const state = makeState({ [TODAY]: { repetitions: 200 } });
    expect(remainingToGoal(state, 300)).toBe(100);
    expect(remainingToGoal(state, 150)).toBe(0); // over goal
  });

  test("returns full goal when nothing logged", () => {
    expect(remainingToGoal(makeState(), 300)).toBe(300);
  });
});

describe("dailyGoal: isValidGoal", () => {
  test("accepts integers 1..10000", () => {
    expect(isValidGoal(1)).toBe(true);
    expect(isValidGoal(333)).toBe(true);
    expect(isValidGoal(10000)).toBe(true);
  });

  test("rejects out of range", () => {
    expect(isValidGoal(0)).toBe(false);
    expect(isValidGoal(10001)).toBe(false);
    expect(isValidGoal(-5)).toBe(false);
  });

  test("rejects non-integers", () => {
    expect(isValidGoal(3.5)).toBe(false);
    expect(isValidGoal("abc")).toBe(false);
    expect(isValidGoal(null)).toBe(false);
    expect(isValidGoal(undefined)).toBe(false);
  });
});
