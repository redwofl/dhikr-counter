import sharp from "sharp";

/**
 * Locate the UI text bands in a capture by row-wise stroke density.
 * Used instead of hardcoded uiautomator bounds, which silently go stale when
 * the layout shifts (e.g. after a round change or a different template).
 */
const files = process.argv.slice(2);
for (const f of files) {
  const orig = await sharp(f).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = orig.info;
  const plate = await sharp(f).removeAlpha().median(5).raw().toBuffer();

  const rows = new Int32Array(H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const d =
        (orig.data[i * C] - plate[i * C]) * 0.2126 +
        (orig.data[i * C + 1] - plate[i * C + 1]) * 0.7152 +
        (orig.data[i * C + 2] - plate[i * C + 2]) * 0.0722;
      if (d > 14) rows[y]++;
    }
  }
  // a text row has a meaningful run of stroke pixels
  const hot = rows.map((n) => n > W * 0.01);
  const bands = [];
  let s = -1;
  for (let y = 0; y <= H; y++) {
    if (y < H && hot[y] && s < 0) s = y;
    else if ((y === H || !hot[y]) && s >= 0) {
      if (y - s > 6) bands.push([s, y]);
      s = -1;
    }
  }
  console.log(f.replace(/^.*[\\/]/, ""));
  console.log("  bands:", bands.map(([a, b]) => `${a}-${b}`).join("  "));
}
