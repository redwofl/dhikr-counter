import sharp from "sharp";

/**
 * Reliable text-contrast measurement.
 *
 * v1 (contrast.mjs) took a high percentile of the region returned by
 * uiautomator. That is wrong: those bounds are the text element's LAYOUT box,
 * which is far larger than the glyphs, so the percentile usually sampled bare
 * background. It gave "all PASS" on one capture and "FAIL" on an identical one.
 *
 * Here we isolate the glyphs directly. Glyphs are thin, high-contrast strokes,
 * so a median filter (which sharp gives us natively) erases them while leaving
 * the background intact. The absolute difference between the original and the
 * median-filtered plate is therefore a text mask that is immune to how much of
 * the layout box the text happens to occupy.
 */
const lum = (r, g, b) => {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const median = (arr) => {
  const s = Float64Array.from(arr).sort();
  return s[s.length >> 1];
};

const [file, ...rest] = process.argv.slice(2);
const THRESH = 14; // 0-255 luma gap that counts as a stroke, not texture

for (const spec of rest) {
  const [label, x1, y1, x2, y2] = spec.split(",").map((s, i) => (i ? +s : s));
  const left = +x1, top = +y1, width = +x2 - +x1, height = +y2 - +y1;

  const orig = await sharp(file)
    .extract({ left, top, width, height })
    .removeAlpha()
    .raw()
    .toBuffer();
  const plate = await sharp(file)
    .extract({ left, top, width, height })
    .removeAlpha()
    .median(5) // erases strokes, keeps background
    .raw()
    .toBuffer();

  const bgLum = [];
  const stroke = [];
  for (let i = 0; i < width * height; i++) {
    const o = lum(orig[i * 3], orig[i * 3 + 1], orig[i * 3 + 2]);
    const p = lum(plate[i * 3], plate[i * 3 + 1], plate[i * 3 + 2]);
    bgLum.push(p);
    const d = (o - p) * 255; // signed: positive means lighter than the plate
    if (d > THRESH) stroke.push(o);
  }

  if (stroke.length < 40) {
    console.log(`${label.padEnd(24)} no text found (${stroke.length} stroke px) - unusable`);
    continue;
  }
  // median of stroke cores, not the max, so one hot pixel can't inflate it
  const textLum = median(stroke);
  const bg = median(bgLum);
  const r = ratio(bg, textLum);
  const verdict = r >= 4.5 ? "PASS AA" : r >= 3 ? "large-text only" : "FAIL";
  console.log(
    `${label.padEnd(24)} bg=${bg.toFixed(3)} text=${textLum.toFixed(3)} ` +
      `contrast=${r.toFixed(2)}:1  ${verdict}  (${stroke.length} px)`
  );
}
