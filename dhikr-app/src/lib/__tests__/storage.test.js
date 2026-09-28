import { describe, it, expect, beforeEach } from "vitest";
import { loadState, saveState, freshState, todayKey, repairState, repairDailyStats, STORAGE_KEY } from "../storage.js";
import { DEFAULT_SETTINGS } from "../../data/templates.js";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing has been saved yet", () => {
    expect(loadState()).toBeNull();
  });

  it("saves and reloads state (round trip)", () => {
    const state = freshState(DEFAULT_SETTINGS);
    state.introCompleted = true;
    saveState(state);
    const loaded = loadState();
    expect(loaded.introCompleted).toBe(true);
    expect(loaded.settings.theme).toBe("system");
  });

  it("recovers gracefully from corrupt JSON instead of throwing", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");
    expect(() => loadState()).not.toThrow();
    expect(loadState()).toBeNull();
  });

  it("backs up corrupt data instead of silently discarding it", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid json");
    loadState();
    expect(localStorage.getItem(STORAGE_KEY + "_corrupt_backup")).toBe("{not valid json");
  });

  it("produces a today key in YYYY-MM-DD format", () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("fills in fields a state written by an older build is missing", () => {
    // `version: 1` is shared by every release, so a save predating
    // `deletedDefaultIds` arrives without it. Handing that straight to React
    // made the first render call `.includes` on undefined and land the user in
    // the ErrorBoundary.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, settings: { theme: "dark" } }));
    const loaded = loadState(DEFAULT_SETTINGS);
    expect(loaded.deletedDefaultIds).toEqual([]);
    expect(loaded.customTemplates).toEqual([]);
    expect(loaded.dailyStats).toEqual({});
    expect(loaded.session).toBeNull();
    expect(loaded.settings.theme).toBe("dark");
    expect(loaded.settings.language).toBe(DEFAULT_SETTINGS.language);
  });

  it("does not treat valid-but-wrong-typed JSON as a recoverable state", () => {
    localStorage.setItem(STORAGE_KEY, "42");
    expect(loadState(DEFAULT_SETTINGS)).toBeNull();
  });
});

describe("repairState", () => {
  it("replaces list fields that are not lists", () => {
    const out = repairState({ version: 1, customTemplates: null, deletedDefaultIds: "nope" }, DEFAULT_SETTINGS);
    expect(out.customTemplates).toEqual([]);
    expect(out.deletedDefaultIds).toEqual([]);
  });

  it("coerces a non-numeric daily goal back to the default", () => {
    // A string goal made the nav progress ring divide NaN and print "NaN%".
    expect(repairState({ settings: { dailyGoal: "a" } }, DEFAULT_SETTINGS).settings.dailyGoal).toBe(
      DEFAULT_SETTINGS.dailyGoal
    );
    expect(repairState({ settings: { dailyGoal: "50" } }, DEFAULT_SETTINGS).settings.dailyGoal).toBe(50);
    expect(repairState({ settings: { dailyGoal: -3 } }, DEFAULT_SETTINGS).settings.dailyGoal).toBe(
      DEFAULT_SETTINGS.dailyGoal
    );
  });

  it("only treats introCompleted as done when it is exactly true", () => {
    expect(repairState({ introCompleted: "yes" }, DEFAULT_SETTINGS).introCompleted).toBe(false);
    expect(repairState({ introCompleted: true }, DEFAULT_SETTINGS).introCompleted).toBe(true);
  });

  it("returns null for a non-object", () => {
    expect(repairState(null, DEFAULT_SETTINGS)).toBeNull();
    expect(repairState([1, 2], DEFAULT_SETTINGS)).toBeNull();
    expect(repairState("x", DEFAULT_SETTINGS)).toBeNull();
  });
});

describe("repairDailyStats", () => {
  it("coerces string counters to numbers so totals cannot concatenate", () => {
    // `0 + "5"` is "05", and ProgressPage's .toLocaleString() then throws.
    expect(repairDailyStats({ "2026-01-01": { repetitions: "5", sessions: "2" } })).toEqual({
      "2026-01-01": { repetitions: 5, sessions: 2 }
    });
  });

  it("replaces bad counts with zero and drops non-object days", () => {
    expect(
      repairDailyStats({
        "2026-01-01": { repetitions: -4, sessions: "x" },
        "2026-01-02": null,
        "2026-01-03": 7
      })
    ).toEqual({ "2026-01-01": { repetitions: 0, sessions: 0 } });
  });

  it("preserves other keys on a day entry", () => {
    expect(repairDailyStats({ "2026-01-01": { repetitions: 1, note: "kept" } })["2026-01-01"].note).toBe("kept");
  });

  it("returns an empty map for anything that is not a plain object", () => {
    expect(repairDailyStats(null)).toEqual({});
    expect(repairDailyStats([1])).toEqual({});
    expect(repairDailyStats("x")).toEqual({});
  });
});
