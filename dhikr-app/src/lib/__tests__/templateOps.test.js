import { describe, it, expect } from "vitest";
import { addTemplate, updateTemplate, removeTemplate, isCustomTemplateId, searchTemplates, validateTemplateDraft } from "../templateOps.js";

const custom = { id: "custom-abc", name: "Morning Dhikr", isDefault: false, items: [{ id: "i1", transliteration: "Subhan Allah", arabic: "سُبْحَانَ اللهِ", count: 33 }] };

describe("addTemplate", () => {
  it("appends a new template without mutating the original array", () => {
    const original = [];
    const next = addTemplate(original, custom);
    expect(original).toHaveLength(0);
    expect(next).toHaveLength(1);
    expect(next[0]).toBe(custom);
  });
});

describe("updateTemplate", () => {
  it("replaces the template with the matching id", () => {
    const updated = { ...custom, name: "Evening Dhikr" };
    const next = updateTemplate([custom], updated);
    expect(next[0].name).toBe("Evening Dhikr");
  });
});

describe("removeTemplate", () => {
  it("removes the template with the matching id", () => {
    const next = removeTemplate([custom], custom.id);
    expect(next).toHaveLength(0);
  });
  it("leaves other templates untouched", () => {
    const other = { ...custom, id: "custom-xyz" };
    const next = removeTemplate([custom, other], custom.id);
    expect(next).toEqual([other]);
  });
});

describe("isCustomTemplateId", () => {
  it("identifies custom template ids", () => {
    expect(isCustomTemplateId("custom-abc")).toBe(true);
    expect(isCustomTemplateId("default-ttt")).toBe(false);
  });
});

describe("searchTemplates", () => {
  const templates = [
    { id: "default-ttt", name: "Tasbih, Tahmid, Takbir", items: [{ transliteration: "Subhan Allah", arabic: "سُبْحَانَ اللهِ" }] },
    { id: "default-istighfar", name: "Istighfar", items: [{ transliteration: "Astaghfirullah al-'Azim", arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ" }] }
  ];

  it("returns everything when the query is empty", () => {
    expect(searchTemplates(templates, "")).toHaveLength(2);
  });

  it("matches by template name, case-insensitively", () => {
    const results = searchTemplates(templates, "istighfar");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("default-istighfar");
  });

  it("matches by transliteration text within items", () => {
    const results = searchTemplates(templates, "subhan");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("default-ttt");
  });

  it("returns an empty array when nothing matches", () => {
    expect(searchTemplates(templates, "zzz-no-match")).toHaveLength(0);
  });
});

describe("validateTemplateDraft", () => {
  it("flags a missing template name", () => {
    const errs = validateTemplateDraft("", [{ id: "l1", transliteration: "A", arabic: "ا", count: 1 }]);
    expect(errs.name).toBe(true);
  });

  it("flags a line missing transliteration, arabic, or a positive count", () => {
    const errs = validateTemplateDraft("Name", [{ id: "l1", transliteration: "", arabic: "ا", count: 1 }]);
    expect(errs.l1).toBe(true);
  });

  it("passes for a fully valid draft", () => {
    const errs = validateTemplateDraft("Name", [{ id: "l1", transliteration: "A", arabic: "ا", count: 33 }]);
    expect(Object.keys(errs)).toHaveLength(0);
  });
});
