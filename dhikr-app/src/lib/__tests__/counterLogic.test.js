import { describe, it, expect } from "vitest";
import {
  applyTap,
  resetSession,
  setCustomMax,
  effectiveMaxFor,
  isValidMaxCount,
  clampSessionToTemplate
} from "../counterLogic.js";
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

  it("survives a missing item instead of throwing during render", () => {
    // A session can point at an item the template no longer has — the custom
    // template was edited shorter while the session was mid-round. This used
    // to dereference `item.id` on undefined and take the app to the
    // ErrorBoundary, whose only recovery erased the whole save.
    const session = { ...newSession(template.id), currentCount: 2 };
    expect(() => effectiveMaxFor(session, undefined)).not.toThrow();
    expect(effectiveMaxFor(session, undefined)).toBe(2);
    expect(effectiveMaxFor(undefined, template.items[0])).toBe(0);
  });
});

describe("setCustomMax with a target below the live count", () => {
  it("stores the value the user entered, not the current count", () => {
    // The counter used to clamp the target up to the live count, so entering 3
    // while 5/33 were counted silently stored 5 and the dialog re-opened on 5.
    let session = newSession(template.id);
    session = { ...session, currentCount: 5 };
    session = setCustomMax(session, "i1", 3);
    expect(effectiveMaxFor(session, template.items[0])).toBe(3);
  });

  it("completes the item on the next tap without overshooting the target", () => {
    let session = newSession(template.id);
    session = { ...session, currentCount: 5 };
    session = setCustomMax(session, "i1", 3);
    const next = applyTap(template, session);
    expect(next.currentItemIndex).toBe(1);
    expect(next.currentCount).toBe(0);
  });
});

describe("clampSessionToTemplate", () => {
  it("pulls an out-of-range index back to the last item", () => {
    // Editing a 3-line custom template down to 2 lines while the session was on
    // line 3 — the exact case that used to crash the counter's next render.
    let session = newSession("t1");
    session = { ...session, currentItemIndex: 2, currentCount: 1 };
    const clamped = clampSessionToTemplate(template, session);
    expect(clamped.currentItemIndex).toBe(1);
    expect(clamped.currentCount).toBe(0);
  });

  it("resets a session whose template has no items left", () => {
    const session = { ...newSession("t1"), currentItemIndex: 1, currentCount: 2, completed: true };
    const clamped = clampSessionToTemplate({ id: "t1", items: [] }, session);
    expect(clamped).toMatchObject({ currentItemIndex: 0, currentCount: 0, completed: false });
  });

  it("leaves an in-range session untouched", () => {
    const session = { ...newSession("t1"), currentItemIndex: 1, currentCount: 1 };
    expect(clampSessionToTemplate(template, session)).toBe(session);
  });

  it("coerces a non-numeric or negative index", () => {
    expect(clampSessionToTemplate(template, { ...newSession("t1"), currentItemIndex: "2" }).currentItemIndex).toBe(1);
    expect(clampSessionToTemplate(template, { ...newSession("t1"), currentItemIndex: -5 }).currentItemIndex).toBe(0);
    expect(clampSessionToTemplate(template, { ...newSession("t1"), currentItemIndex: NaN }).currentItemIndex).toBe(0);
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
