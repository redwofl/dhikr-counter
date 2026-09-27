import { describe, it, expect } from "vitest";
import { TRANSLATIONS } from "../translations.js";

const LANGUAGES = Object.keys(TRANSLATIONS);
const ENGLISH_KEYS = Object.keys(TRANSLATIONS.en);

describe("TRANSLATIONS", () => {
  it("ships English plus the supported RTL and Latin languages", () => {
    expect(LANGUAGES).toEqual(["en", "ar", "ur", "tr", "id"]);
  });

  // A key that exists only in English renders English text inside an otherwise
  // translated screen (t.foo || "Fallback" hides it), so parity is enforced
  // rather than assumed.
  it.each(LANGUAGES)("%s defines exactly the same keys as English", (lang) => {
    const keys = Object.keys(TRANSLATIONS[lang]);
    expect(keys.filter((k) => !ENGLISH_KEYS.includes(k))).toEqual([]);
    expect(ENGLISH_KEYS.filter((k) => !keys.includes(k))).toEqual([]);
  });

  it.each(LANGUAGES)("%s has no empty or non-string values", (lang) => {
    const empty = Object.entries(TRANSLATIONS[lang])
      .filter(([, value]) => typeof value !== "string" || value.trim() === "")
      .map(([key]) => key);
    expect(empty).toEqual([]);
  });

  // Placeholders are interpolated with .replace() at the call sites, so a
  // translation that drops one would render "undefined" to the user.
  it.each(LANGUAGES)("%s keeps the weekly summary placeholders", (lang) => {
    const body = TRANSLATIONS[lang].weeklySummaryBody;
    ["{reps}", "{days}", "{streak}"].forEach((token) => {
      expect(body).toContain(token);
    });
  });

  it("keeps daily prayers and adhkar labels translated, not copied from English", () => {
    ["ar", "ur"].forEach((lang) => {
      expect(TRANSLATIONS[lang].fajr).not.toBe(TRANSLATIONS.en.fajr);
      expect(TRANSLATIONS[lang].dailyAdhkar).not.toBe(TRANSLATIONS.en.dailyAdhkar);
    });
  });
});
