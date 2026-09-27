// Remove short vowel / diacritical marks (tashkeel, harakat) from Arabic so the
// letters render clean without tiny gold signs floating above them.
const TASHKEEL = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08E1\uFC5E-\uFC63]/g;

export function stripTashkeel(text) {
  if (!text) return text;
  return text.replace(TASHKEEL, "").replace(/\s{2,}/g, " ").trim();
}

/**
 * Visible-width proxy for an Arabic string: harakat float *above* the letters
 * and add no advance width, so they must not count toward sizing. Spaces are
 * dropped too — we size by letter count only.
 */
export function arabicVisualLength(text) {
  if (!text) return 0;
  return stripTashkeel(String(text)).replace(/\s/g, "").length;
}

/**
 * Font-size tier for the big current-dhikr headline on the counter page.
 * The column is 280px wide; Arabic bold averages ~0.52em advance per letter,
 * so each tier keeps its longest phrase inside the column:
 *   10 letters @ 3.1rem ≈ 260px, 14 @ 2.4rem ≈ 278px, 20 @ 1.9rem ≈ 251px.
 * Short phrases (Subhan Allah, Alhamdulillah, Allahu Akbar) keep the original
 * display size — tiers only step down as the phrase grows.
 */
export function arabicHeadlineClass(text) {
  const n = arabicVisualLength(text);
  if (n <= 10) return "text-[3.1rem]";
  if (n <= 14) return "text-[2.4rem]";
  if (n <= 20) return "text-[1.9rem]";
  return "text-[1.55rem]";
}

/**
 * Font-size tier for the floating bloom over the beads. The bloom may span a
 * little wider than the headline but must stay near the 280px counter.
 */
export function arabicBloomClass(text) {
  const n = arabicVisualLength(text);
  if (n <= 10) return "text-[1.7rem]";
  if (n <= 14) return "text-[1.4rem]";
  if (n <= 20) return "text-[1.15rem]";
  return "text-[1rem]";
}