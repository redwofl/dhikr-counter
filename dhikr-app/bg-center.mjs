import sharp from "sharp";

/**
 * Is the background image actually centred on screen?
 *
 * Two different things can be called "not centred", and they need different
 * fixes, so both are measured:
 *
 *  1. Geometry — the ::before box does not span the viewport symmetrically. The
 *     rules give it `inset-inline-end: -6px` and `inset-inline-start:
 *     calc(-1 * var(--bg-bleed))`, and the counter page sets --bg-bleed to 0, so
 *     the box is flush left and overhangs right. `background-position: 50% 50%`
 *     then centres the photo on that off-centre box, not on the screen.
 *
 *  2. Content — the photo's own visual weight may sit off-centre (a bright band,
 *     a subject), so even a perfectly centred box shows the picture lopsided.
 *     Reported as the luminance centroid and the centroid of local detail
 *     (luma standard deviation), both in percent of width from the left edge.
 *
 * Usage: node bg-center.mjs <image>
 */
const [, , file] = process.argv;
if (!file) {
  console.error("usage: node bg-center.mjs <image>");
  process.exit(1);
}

const img = sharp(file).removeAlpha();
const { width: W, height: H } = await img.metadata();
const { data } = await img.raw().toBuffer({ resolveWithObject: true });

const luma = (i) => 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

// Column profile: mean luma and mean absolute luma gradient per column.
const colLuma = new Float64Array(W);
const colDetail = new Float64Array(W);
const colCount = new Float64Array(W);

for (let x = 0; x < W; x++) {
  let sum = 0, det = 0, n = 0;
  for (let y = 0; y < H; y += 2) {
    const l = luma((y * W + x) * 3);
    sum += l;
    if (y + 2 < H) det += Math.abs(l - luma(((y + 2) * W + x) * 3));
    n++;
  }
  colLuma[x] = sum / n;
  colDetail[x] = det / n;
  colCount[x] = n;
}

const centroid = (arr) => {
  let num = 0, den = 0;
  for (let x = 0; x < W; x++) {
    num += x * arr[x];
    den += arr[x];
  }
  return den === 0 ? NaN : (num / den / W) * 100;
};

// Trim the outer 4% on each side before measuring the centroid, so a vignette
// or a dark border at the very edge cannot drag the result off-centre by itself.
const trimmedCentroid = (arr) => {
  const lo = Math.floor(W * 0.04), hi = Math.ceil(W * 0.96);
  let num = 0, den = 0;
  for (let x = lo; x < hi; x++) {
    num += x * arr[x];
    den += arr[x];
  }
  return den === 0 ? NaN : (num / den / W) * 100;
};

const edge = Math.floor(W * 0.1);
const meanOf = (arr, from, to) => {
  let s = 0;
  for (let x = from; x < to; x++) s += arr[x];
  return s / (to - from);
};

console.log(`  ${file.split(/[\\/]/).pop()}  ${W}x${H}\n`);
console.log(`  luminance centroid     ${centroid(colLuma).toFixed(1)}% from left   (50% = centred)`);
console.log(`  same, outer 4% trimmed ${trimmedCentroid(colLuma).toFixed(1)}%`);
console.log(`  detail centroid        ${centroid(colDetail).toFixed(1)}% from left`);
console.log(`  same, outer 4% trimmed ${trimmedCentroid(colDetail).toFixed(1)}%\n`);
console.log(`  left  10% mean luma ${meanOf(colLuma, 0, edge).toFixed(1)}`);
console.log(`  right 10% mean luma ${meanOf(colLuma, W - edge, W).toFixed(1)}`);
console.log(`  left  10% mean detail ${meanOf(colDetail, 0, edge).toFixed(2)}`);
console.log(`  right 10% mean detail ${meanOf(colDetail, W - edge, W).toFixed(2)}`);

const off = Math.abs(trimmedCentroid(colLuma) - 50);
console.log(
  `\n  content offset: ${trimmedCentroid(colLuma).toFixed(1)}% - 50% = ` +
    `${(trimmedCentroid(colLuma) - 50 > 0 ? "+" : "") + (trimmedCentroid(colLuma) - 50).toFixed(1)}% ` +
    `(${(off / 100 * W).toFixed(0)} px of ${W})`
);
