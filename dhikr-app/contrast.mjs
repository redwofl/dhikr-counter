import sharp from "sharp";

/**
 * WCAG contrast check for the counter's light-on-photo labels.
 * For each text region we take the median luminance as the local background
 * and the 98th percentile as the text itself, then compute the real contrast
 * ratio between them.
 */
const lum = (r, g, b) => {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (l1, l2) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

const [file, ...rest] = process.argv.slice(2);
const { data, info } = await sharp(file)
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, channels: C } = info;

for (const spec of rest) {
  const [label, x1, y1, x2, y2] = spec.split(",");
  const lums = [];
  for (let y = +y1; y < +y2; y++) {
    for (let x = +x1; x < +x2; x++) {
      const i = (y * W + x) * C;
      lums.push(lum(data[i], data[i + 1], data[i + 2]));
    }
  }
  lums.sort((a, b) => a - b);
  const q = (p) => lums[Math.floor(p * (lums.length - 1))];
  const bg = q(0.5);
  const text = q(0.98);
  const r = ratio(bg, text);
  const verdict = r >= 4.5 ? "PASS AA" : r >= 3 ? "large-text only" : "FAIL";
  console.log(
    `${label.padEnd(26)} bg=${bg.toFixed(3)} text=${text.toFixed(3)}  contrast=${r.toFixed(2)}:1  ${verdict}`
  );
}
