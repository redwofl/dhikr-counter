import { describe, it, expect } from "vitest";
import { DEFAULT_TEMPLATES, newSession, uid } from "../templates.js";

describe("DEFAULT_TEMPLATES", () => {
  it("includes the classic Tasbih, Tahmid, Takbir routine with 33x each", () => {
    const ttt = DEFAULT_TEMPLATES.find((t) => t.id === "default-ttt");
    expect(ttt).toBeDefined();
    expect(ttt.items).toHaveLength(3);
    ttt.items.forEach((item) => expect(item.count).toBe(33));
  });

  it("every default template has at least one item with transliteration, arabic, and a positive count", () => {
    DEFAULT_TEMPLATES.forEach((tpl) => {
      expect(tpl.items.length).toBeGreaterThan(0);
      tpl.items.forEach((item) => {
        expect(item.transliteration.length).toBeGreaterThan(0);
        expect(item.arabic.length).toBeGreaterThan(0);
        expect(item.count).toBeGreaterThan(0);
      });
    });
  });

  it("has unique ids across all default templates", () => {
    const ids = DEFAULT_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("newSession", () => {
  it("starts at item 0, count 0, not completed", () => {
    const session = newSession("default-ttt");
    expect(session.templateId).toBe("default-ttt");
    expect(session.currentItemIndex).toBe(0);
    expect(session.currentCount).toBe(0);
    expect(session.completed).toBe(false);
    expect(session.completedItems).toEqual([]);
  });
});

describe("uid", () => {
  it("generates non-empty, reasonably unique ids", () => {
    const ids = new Set(Array.from({ length: 100 }, () => uid()));
    expect(ids.size).toBeGreaterThan(90);
  });
});
