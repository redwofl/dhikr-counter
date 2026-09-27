import sharp from "sharp";
import { readdirSync } from "fs";

/** Whole-image similarity between screenshots, to spot duplicates/blank frames. */
const files = process.argv.slice(2);
const sig = async (f) => {
  const s = await sharp(f).resize(64, 144, { fit: "fill" }).greyscale().raw().toBuffer();
  return Float64Array.from(s);
};
const ncc = (a, b) => {
  const n = a.length;
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let i = 0; i < n; i++) { sa += a[i]; sb += b[i]; saa += a[i] * a[i]; sbb += b[i] * b[i]; sab += a[i] * b[i]; }
  const cov = sab / n - (sa / n) * (sb / n);
  const va = saa / n - (sa / n) ** 2, vb = sbb / n - (sb / n) ** 2;
  return va > 1e-9 && vb > 1e-9 ? cov / Math.sqrt(va * vb) : 0;
};
const sigs = {};
for (const f of files) sigs[f] = await sig(f);
console.log("pairwise NCC (>=0.98 means duplicate frame)");
for (let i = 0; i < files.length; i++) {
  for (let j = i + 1; j < files.length; j++) {
    const r = ncc(sigs[files[i]], sigs[files[j]]);
    if (r >= 0.9) console.log(`  ${r.toFixed(3)}  ${files[i]}  <->  ${files[j]}`);
  }
}
console.log("\nself-similarity to a blank/uniform frame:");
for (const f of files) {
  const s = await sharp(f).stats();
  const sd = (s.channels[0].stdev + s.channels[1].stdev + s.channels[2].stdev) / 3;
  console.log(`  ${f.padEnd(22)} stdev=${sd.toFixed(1)} ${sd < 8 ? "BLANK" : ""}`);
}
