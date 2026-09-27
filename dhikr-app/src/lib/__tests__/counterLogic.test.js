import { describe, it, expect } from "vitest";
import { applyTap, resetSession, setCustomMax, effectiveMaxFor, isValidMaxCount } from "../counterLogic.js";
import { newSession } from "../../data/templates.js";

const template = {
  id: "t1",
  name: "Test Template",
  items: [
    { id: "i1", transliteration: "Subhan Allah", arabic: "سُبْحَانَ اللهِ", count: 3 },
    { id: "i2", transliteration: "Alhamdulillah", arabic: "الْحَمْدُ لِلَّهِ", count: 2 }
  ]
};

describe("applyTap", () => {
  it("increments the count by one", () => {
    const session = newSession(template.id);
    const next = applyTap(template, session);
    expect(next.currentCount).toBe(1);
    expect(next.currentItemIndex).toBe(0);
  });

  it("never increments past the item's maximum", () => {
    let session = newSession(template.id);
    session = { ...session, currentCount: 3 }; // already at max for item 1 (count: 3)
    const next = applyTap(template, session);
    // at max, the next tap should roll over to the next item instead of exceeding max
    expect(next.currentItemIndex).toBe(1);
    expect(next.currentCount).toBe(0);
  });

  it("moves to the next dhikr item after reaching max, resetting count to 0", () => {
    let session = newSession(template.id);
    session = { ...session, currentCount: 2 }; // one tap away from item 1's max of 3
    const next = applyTap(template, session);
    expect(next.currentItemIndex).toBe(1);
    expect(next.currentCount).toBe(0);
    expect(next.completedItems).toContain("i1");
  });

  it("marks the session completed after the final item reaches its max", () => {
    let session = newSession(template.id);
    session = { ...session, currentItemIndex: 1, currentCount: 1 }; // one tap away from item 2's max of 2
    const next = applyTap(template, session);
    expect(next.completed).toBe(true);
    expect(next.currentCount).toBe(2);
    expect(next.completedItems).toEqual(["i2"]);
  });

  it("does nothing once the session is already completed", () => {
    let session = newSession(template.id);
    session = { ...session, completed: true, currentCount: 5 };
    const next = applyTap(template, session);
    expect(next).toBe(session);
  });

  it("respects a custom max count for the current item", () => {
    let session = newSession(template.id);
    session = setCustomMax(session, "i1", 1);
    const next = applyTap(template, session);
    expect(next.currentItemIndex).toBe(1); // rolled over after just 1 tap, not 3
  });
});

describe("resetSession", () => {
  it("resets count, item index, and completed items back to zero", () => {
    let session = newSession(template.id);
    session = { ...session, currentItemIndex: 1, currentCount: 4, completedItems: ["i1"], completed: true };
    const reset = resetSession(session);
    expect(reset.currentItemIndex).toBe(0);
    expect(reset.currentCount).toBe(0);
    expect(reset.completedItems).toEqual([]);
    expect(reset.completed).toBe(false);
  });
});

describe("effectiveMaxFor", () => {
  it("falls back to the item's default count with no custom max set", () => {
    const session = newSession(template.id);
    expect(effectiveMaxFor(session, template.items[0])).toBe(3);
  });

  it("uses the custom max when one has been set for that item", () => {
    let session = newSession(template.id);
    session = setCustomMax(session, "i1", 500);
    expect(effectiveMaxFor(session, template.items[0])).toBe(500);
  });
});

describe("isValidMaxCount", () => {
  it("accepts integers from 1 to 10000", () => {
    expect(isValidMaxCount(1)).toBe(true);
    expect(isValidMaxCount(33)).toBe(true);
    expect(isValidMaxCount(10000)).toBe(true);
  });
  it("rejects zero, negatives, decimals, and values above 10000", () => {
    expect(isValidMaxCount(0)).toBe(false);
    expect(isValidMaxCount(-5)).toBe(false);
    expect(isValidMaxCount(3.5)).toBe(false);
    expect(isValidMaxCount(10001)).toBe(false);
    expect(isValidMaxCount(NaN)).toBe(false);
    expect(isValidMaxCount("")).toBe(false);
  });
});
