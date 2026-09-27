import sharp from "sharp";

/**
 * Compare target screenshots against KNOWN-GOOD reference renders.
 *
 * Unlike bg-match*.mjs this never guesses the background geometry: both sides
 * are real renders produced by the same app on the same emulator, so the UI,
 * the overlays and the cover-fit are already identical and contribute signal
 * instead of noise. We report two scores:
 *   full  - whole frame (UI included; helps when app state matches)
 *   margin- only the left/right strips outside the 280px content column, which
 *           are pure background and therefore immune to differing app state
 */
const [target, ...refs] = process.argv.slice(2);
if (!target || !refs.length) {
  console.error("usage: node cmp-refs.mjs <target> <ref1> [ref2 ...]");
  process.exit(1);
}

// content column is 280 CSS px wide, centred -> ~x 400..680 device px on 1080w.
// Use 0..12% and 88%..100% of width as background-only margins.
const load = async (f) => {
  const s = await sharp(f)
    .resize(180, 404, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer();
  return s;
};
const ncc = (a, b) => {
  const n = a.length;
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let i = 0; i < n; i++) {
    sa += a[i]; sb += b[i]; saa += a[i] * a[i]; sbb += b[i] * b[i]; sab += a[i] * b[i];
  }
  const cov = sab / n - (sa / n) * (sb / n);
  const va = saa / n - (sa / n) ** 2, vb = sbb / n - (sb / n) ** 2;
  return va > 1e-9 && vb > 1e-9 ? cov / Math.sqrt(va * vb) : 0;
};
const margin = (buf) => {
  const W = 180;
  const out = [];
  for (let y = 0; y < 404; y++) {
    for (let x = 0; x < 22; x++) out.push(buf[y * W + x]);
    for (let x = 158; x < W; x++) out.push(buf[y * W + x]);
  }
  return out;
};

const tFull = await load(target);
const tMargin = margin(tFull);

const rows = [];
for (const r of refs) {
  const rFull = await load(r);
  rows.push({
    ref: r,
    full: ncc(tFull, rFull),
    margin: ncc(tMargin, margin(rFull)),
  });
}
rows.sort((a, b) => b.margin - a.margin);

console.log(`target: ${target}\n`);
console.log("rank  reference                        marginNCC   fullNCC");
rows.forEach((r, i) =>
  console.log(
    `${String(i + 1).padStart(4)}  ${r.ref.padEnd(32)} ${r.margin.toFixed(3).padStart(8)} ${r.full
      .toFixed(3)
      .padStart(8)}`
  )
);
