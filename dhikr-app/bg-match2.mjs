import sharp from "sharp";
import { readdirSync } from "fs";

/**
 * Identify which background variant produced an emulator screenshot.
 *
 * v2 fixes two flaws in the first attempt:
 *  - the old CSS stacked a 128px film-grain tile, which is HIGH frequency, so
 *    a high-pass does not remove it and it swamped the correlation. We now
 *    downscale hard first (the grain averages away) and high-pass at a radius
 *    scaled to the new resolution.
 *  - a free-running "best window" search can lock onto a spurious correlation
 *    in a flat patch. We can restrict the search to a region that is free of
 *    UI, and we always report the ground-truth control alongside.
 *
 * usage: node bg-match2.mjs <screenshot> <candDir> [region x1,y1,x2,y2]
 */
const [target, dir, region] = process.argv.slice(2);
const W = 200;
const tm = await sharp(target).metadata();
const th = Math.round((tm.height / tm.width) * W);

const gray = async (f) =>
  (await sharp(f).resize(W, th, { fit: "cover", position: "centre" }).greyscale().raw().toBuffer());

function boxBlur(px, w, h, r) {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let d = -r; d <= r; d++) {
        const xx = x + d;
        if (xx >= 0 && xx < w) { s += px[y * w + xx]; n++; }
      }
      tmp[y * w + x] = s / n;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0, n = 0;
      for (let d = -r; d <= r; d++) {
        const yy = y + d;
        if (yy >= 0 && yy < h) { s += tmp[yy * w + x]; n++; }
      }
      out[y * w + x] = s / n;
    }
  return out;
}
const highpass = (px, w, h, r) => {
  const b = boxBlur(px, w, h, r);
  const o = new Float32Array(w * h);
  for (let i = 0; i < o.length; i++) o[i] = px[i] - b[i];
  return o;
};
function ncc(a, b) {
  const n = a.length;
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let i = 0; i < n; i++) {
    sa += a[i]; sb += b[i]; saa += a[i] * a[i]; sbb += b[i] * b[i]; sab += a[i] * b[i];
  }
  const cov = sab / n - (sa / n) * (sb / n);
  const va = saa / n - (sa / n) ** 2;
  const vb = sbb / n - (sb / n) ** 2;
  return va > 1e-9 && vb > 1e-9 ? cov / Math.sqrt(va * vb) : 0;
}

const tImg = highpass(await gray(target), W, th, 3);
const cands = readdirSync(dir).filter((f) => /\.(png|jpg|webp)$/i.test(f)).sort();

const [rx1, ry1, rx2, ry2] = region
  ? region.split(",").map(Number)
  : [0, 0, W, th];

const WIN = 36, STRIDE = 8;
const rows = [];
for (const f of cands) {
  const cImg = highpass(await gray(`${dir}/${f}`), W, th, 3);
  let best = -2, bx = 0, by = 0, sum = 0, cnt = 0;
  for (let y = ry1; y + WIN <= Math.min(ry2, th - 4); y += STRIDE) {
    for (let x = rx1; x + WIN <= Math.min(rx2, W - 4); x += STRIDE) {
      const wa = [], wb = [];
      for (let yy = 0; yy < WIN; yy++)
        for (let xx = 0; xx < WIN; xx++) {
          wa.push(tImg[(y + yy) * W + (x + xx)]);
          wb.push(cImg[(y + yy) * W + (x + xx)]);
        }
      const r = ncc(wa, wb);
      sum += r; cnt++;
      if (r > best) { best = r; bx = x; by = y; }
    }
  }
  rows.push({ f, best, mean: cnt ? sum / cnt : 0, bx, by });
}
rows.sort((a, b) => b.mean - a.mean);
console.log(`${target}  ${tm.width}x${tm.height}  region=[${rx1},${ry1},${rx2},${ry2}]  W=${W}`);
console.log("rank  variant                        meanNCC   bestNCC");
rows.forEach((r, i) =>
  console.log(
    `${String(i + 1).padStart(4)}  ${r.f.padEnd(30)} ${r.mean.toFixed(3).padStart(7)} ${r.best.toFixed(3).padStart(8)}`
  )
);
