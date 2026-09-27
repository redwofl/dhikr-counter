import sharp from "sharp";

/**
 * Text contrast measured against the background *immediately around* the glyph.
 *
 * Why this exists alongside contrast2.mjs: contrast2 reports the median
 * luminance of the median-filtered plate across the whole region. That is the
 * right instrument for "is this text legible on this backdrop", but it is blind
 * to a text-shadow. A shadow darkens a thin band hugging the glyphs — a small
 * minority of the region — so the median never moves. Measuring six shadow
 * weights that way returned 9.07:1 for every one of them, including none at all.
 *
 * A shadow does not make gold brighter; it darkens the few pixels the eye
 * actually compares the gold against. So this measures exactly that: the local
 * surround. The glyph mask is blurred, and the annulus where the blurred mask
 * has decayed but not vanished is the halo the glyph sits in.
 *
 * The headline number is haloContrast (stroke vs its own surround). The plain
 * region-wide ratio is reported too, so the two tools can be cross-checked —
 * haloContrast should only ever be the *lower* of the two, since the surround is
 * a subset of the region.
 *
 * Usage: node contrast-halo.mjs <file> "label,x1,y1,x2,y2" [...]
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
// A text-shadow darkens a ring hugging the glyphs, so the darkest part of that
// ring is the part the eye actually gains from. The median can sit above it.
const pct = (arr, p) => {
  const s = Float64Array.from(arr).sort();
  return s[Math.min(s.length - 1, Math.floor(s.length * p))];
};

const [file, ...rest] = process.argv.slice(2);
const THRESH = 14; // 0-255 luma gap that counts as a stroke, not texture
const BLUR = 2.5; // px sigma; wide enough to spill outside the glyph edge

for (const spec of rest) {
  const [label, x1, y1, x2, y2] = spec.split(",").map((s, i) => (i ? +s : s));
  const left = +x1, top = +y1, width = +x2 - +x1, height = +y2 - +y1;

  const orig = await sharp(file).extract({ left, top, width, height }).removeAlpha().raw().toBuffer();
  const plate = await sharp(file).extract({ left, top, width, height }).removeAlpha().median(5).raw().toBuffer();

  const n = width * height;
  const mask = new Uint8Array(n);
  const stroke = [];
  const bgAll = [];

  for (let i = 0; i < n; i++) {
    const o = lum(orig[i * 3], orig[i * 3 + 1], orig[i * 3 + 2]);
    const p = lum(plate[i * 3], plate[i * 3 + 1], plate[i * 3 + 2]);
    bgAll.push(p);
    if ((o - p) * 255 > THRESH) {
      mask[i] = 255;
      stroke.push(o);
    }
  }

  if (stroke.length < 40) {
    console.log(`${label.padEnd(20)} no text found (${stroke.length} stroke px) - unusable`);
    continue;
  }

  // Blur the mask so "near the glyph" becomes a thresholdable band.
  const soft = await sharp(mask, { raw: { width, height, channels: 1 } })
    .blur(BLUR)
    .raw()
    .toBuffer();

  const halo = [];
  for (let i = 0; i < n; i++) {
    // Decayed out of the glyph core, but still inside its blurred footprint:
    // this is the band the gold is read against.
    if (!mask[i] && soft[i] > 8 && soft[i] < 130) {
      // Read the surround from the ORIGINAL image, not the plate. The plate is a
      // median-filtered copy, and once a shadow is present the glyph+shadow
      // structure is wider than the 5px kernel — so the plate stops erasing it
      // and retains bright glyph fragments. Reading the halo from the plate
      // therefore reported the background getting *lighter* as the shadow got
      // heavier (0.056 -> 0.062), and the ratio fell, which is backwards. The
      // halo excludes mask pixels anyway, so the original is the honest source.
      halo.push(lum(orig[i * 3], orig[i * 3 + 1], orig[i * 3 + 2]));
    }
  }

  if (halo.length < 40) {
    console.log(`${label.padEnd(20)} halo too small (${halo.length} px) - unusable`);
    continue;
  }

  const textLum = median(stroke);
  const haloLum = median(halo);
  const haloDark = pct(halo, 0.1);
  const regionLum = median(bgAll);
  const rHalo = ratio(haloLum, textLum);
  const rDark = ratio(haloDark, textLum);
  const rRegion = ratio(regionLum, textLum);

  console.log(
    `${label.padEnd(20)} text=${textLum.toFixed(3)} haloMed=${haloLum.toFixed(3)} ` +
      `haloP10=${haloDark.toFixed(3)}  edge=${rDark.toFixed(2)}:1  halo=${rHalo.toFixed(2)}:1  ` +
      `region=${rRegion.toFixed(2)}:1  (${halo.length} halo px)`
  );
}
