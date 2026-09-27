import sharp from "sharp";
import { readdirSync, existsSync } from "fs";

/**
 * Identify which background variant produced a given emulator screenshot.
 *
 * The app paints the photo with `background-size: cover; background-position:
 * center`, so cover-fitting a candidate to the screenshot's own dimensions
 * reproduces exactly what the WebView rendered. The old CSS also stacked
 * smooth gradient overlays (scrim / brown wash) on top, which only shift low
 * frequencies — so we compare HIGH-PASSED grayscale, where those overlays
 * contribute almost nothing and the photo's own structure decides the match.
 * A sliding window lets us skip whatever parts of the screen the UI covers.
 */
const target = process.argv[2];
if (!target) {
  console.error("usage: node bg-match.mjs <screenshot.png> [dir-with-candidates]");
  process.exit(1);
}
const dir = process.argv[3] || "public";

const W = 320; // downscale for speed
const tm = await sharp(target).metadata();
const th = Math.round((tm.height / tm.width) * W);
const SCALE = tm.width / W;

const gray = async (buf, w, h) => {
  const { data } = await sharp(buf)
    .resize(w, h, { fit: "cover", position: "centre" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
};

// high-pass = original minus a heavy box blur (kills smooth overlay gradients)
function highpass(px, w, h, r = 6) {
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, n = 0;
      for (let dy = -r; dy <= r; dy += 2) {
        const yy = y + dy;
        if (yy < 0 || yy >= h) continue;
        for (let dx = -r; dx <= r; dx += 2) {
          const xx = x + dx;
          if (xx < 0 || xx >= w) continue;
          sum += px[yy * w + xx];
          n++;
        }
      }
      out[y * w + x] = px[y * w + x] - sum / n;
    }
  }
  return out;
}

const tImg = highpass(await gray(target, W, th), W, th);

/** Pearson correlation over two equal-length flat arrays. */
function ncc(a, b) {
  const n = a.length;
  let sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let i = 0; i < n; i++) {
    const va = a[i], vb = b[i];
    sa += va; sb += vb; saa += va * va; sbb += vb * vb; sab += va * vb;
  }
  const cov = sab / n - (sa / n) * (sb / n);
  const va2 = saa / n - (sa / n) ** 2;
  const vb2 = sbb / n - (sb / n) ** 2;
  return va2 > 1e-6 && vb2 > 1e-6 ? cov / Math.sqrt(va2 * vb2) : 0;
}

const cands = readdirSync(dir)
  .filter((f) => /^counter-bg.*\.(png|jpg|webp)$/i.test(f) && !f.includes("BACKUP"))
  .sort();

const WIN = 48, STRIDE = 16;
const results = [];
for (const f of cands) {
  const cImg = highpass(await gray(`${dir}/${f}`, W, th), W, th);
  let best = -2, bx = 0, by = 0;
  for (let y = 0; y + WIN <= th - 8; y += STRIDE) {
    for (let x = 0; x + WIN <= W - 8; x += STRIDE) {
      const wa = [], wb = [];
      for (let yy = 0; yy < WIN; yy++) {
        for (let xx = 0; xx < WIN; xx++) {
          wa.push(tImg[(y + yy) * W + (x + xx)]);
          wb.push(cImg[(y + yy) * W + (x + xx)]);
        }
      }
      const r = ncc(wa, wb);
      if (r > best) { best = r; bx = x; by = y; }
    }
  }
  results.push({ f, best, bx: Math.round(bx * SCALE), by: Math.round(by * SCALE) });
}

results.sort((a, b) => b.best - a.best);
console.log(`target: ${target}  (${tm.width}x${tm.height})\n`);
console.log("rank  variant                        best NCC   window(x,y)");
results.forEach((r, i) => {
  console.log(
    `${String(i + 1).padStart(4)}  ${r.f.padEnd(30)} ${r.best.toFixed(3).padStart(7)}   (${r.bx}, ${r.by})`
  );
});
