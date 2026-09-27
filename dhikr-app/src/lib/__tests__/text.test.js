import { describe, it, expect } from "vitest";
import { stripTashkeel, arabicVisualLength, arabicHeadlineClass, arabicBloomClass } from "../text.js";

describe("stripTashkeel", () => {
  it("removes harakat but keeps letters", () => {
    expect(stripTashkeel("سُبْحَانَ ٱللَّهِ")).toBe("سبحان ٱلله");
  });

  it("collapses doubled spaces and trims", () => {
    expect(stripTashkeel("a  b")).toBe("a b");
  });

  it("handles empty input", () => {
    expect(stripTashkeel("")).toBe("");
    expect(stripTashkeel(null)).toBe(null);
  });
});

describe("arabicVisualLength", () => {
  it("counts letters only — harakat and spaces add nothing", () => {
    // سبحان (5) + الله (4) = 9 letters; harakat stripped, space dropped
    expect(arabicVisualLength("سُبْحَانَ ٱللَّهِ")).toBe(9);
  });

  it("counts unvocalized text the same way", () => {
    expect(arabicVisualLength("سبحان الله")).toBe(9);
  });

  it("handles empty", () => {
    expect(arabicVisualLength("")).toBe(0);
  });
});

describe("arabicHeadlineClass", () => {
  it("keeps display size for short phrases", () => {
    // Subhan Allah / Alhamdulillah / Allahu Akbar — the common 33x set
    expect(arabicHeadlineClass("سُبْحَانَ ٱللَّهِ")).toBe("text-[3.1rem]");   // 9 letters
    expect(arabicHeadlineClass("ٱلْحَمْدُ لِلَّهِ")).toBe("text-[3.1rem]");    // 8 letters
  });

  it("steps down for medium phrases", () => {
    // أستغفر الله العظيم = 6+4+6 = 16 letters
    expect(arabicHeadlineClass("أَسْتَغْفِرُ ٱللَّهَ ٱلْعَظِيمَ")).toBe("text-[1.9rem]");
  });

  it("smallest tier for very long phrases", () => {
    // Bismillah alladhi… opening of the hasbiallah-style dhikr — 26 letters
    expect(arabicHeadlineClass("بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ")).toBe("text-[1.55rem]");
  });

  it("handles empty", () => {
    expect(arabicHeadlineClass("")).toBe("text-[3.1rem]");
  });
});

describe("arabicBloomClass", () => {
  it("largest tier for short words", () => {
    expect(arabicBloomClass("سُبْحَانَ")).toBe("text-[1.7rem]"); // 5 letters
  });

  it("steps down for long phrases", () => {
    expect(arabicBloomClass("أَسْتَغْفِرُ ٱللَّهَ ٱلْعَظِيمَ")).toBe("text-[1.15rem]"); // 16 letters
  });
});
