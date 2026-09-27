import sharp from "sharp";

/**
 * Did the UI actually paint in this capture?
 *
 * The tour verified "not blank" via pixel stdev and "not a duplicate" via NCC.
 * Both pass on a frame where the background painted but the UI never did, so
 * add the check they were missing: count glyph strokes across the whole frame.
 * A real counter screen has tens of thousands of them; a background-only frame
 * has almost none.
 */
const files = process.argv.slice(2);
for (const f of files) {
  const orig = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = orig.info;
  const plate = await sharp(f).removeAlpha().median(5).raw().toBuffer();

  let strokes = 0;
  for (let i = 0; i < W * H; i++) {
    const d =
      (orig.data[i * C] - plate[i * C]) * 0.2126 +
      (orig.data[i * C + 1] - plate[i * C + 1]) * 0.7152 +
      (orig.data[i * C + 2] - plate[i * C + 2]) * 0.0722;
    if (d > 14) strokes++;
  }
  const pct = (strokes / (W * H)) * 100;
  const verdict = strokes < 3000 ? "UI MISSING" : strokes < 12000 ? "sparse UI" : "UI OK";
  console.log(
    `${f.replace(/^.*[\\/]/, "").padEnd(20)} strokes=${String(strokes).padStart(7)} (${pct.toFixed(2)}%)  ${verdict}`
  );
}
