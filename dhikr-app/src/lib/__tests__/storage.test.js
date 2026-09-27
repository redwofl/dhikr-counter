import { describe, it, expect, beforeEach } from "vitest";
import { loadState, saveState, freshState, todayKey, STORAGE_KEY } from "../storage.js";
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
});
