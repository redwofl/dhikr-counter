import sharp from "sharp";
import { writeFileSync } from "node:fs";

/**
 * Recover as much crispness as possible from a background that is too small.
 *
 * The problem: the deployed photo is 836x1881 source pixels, but the WebView
 * viewport is 412x924 CSS px at 2.625 dpr = 1081.5x2425.5 device px. The browser
 * was scaling it up ~1.29x at paint time with its own filtering, which is what
 * makes it look soft. Pre-upscaling with Lanczos3 and a mild unsharp mask hands
 * the compositor 1:1 device pixels instead, so the browser no longer has to
 * invent them.
 *
 * The honest ceiling: upscaling cannot recover detail that was never captured.
 * This improves *perceived* sharpness — cleaner edges, less mush — and cannot
 * make the photo more detailed than it is. Every candidate is measured for
 * high-frequency energy and, more importantly, for clipping, because the way to
 * make an image "sharper" is also the way to make it ring and halo.
 *
 * Usage: node bg-sharpen.mjs <source> [out-prefix]
 */

const [, , SRC, PREFIX = "./cand"] = process.argv;
if (!SRC) {
  console.error("usage: node bg-sharpen.mjs <source-image> [out-prefix]");
  process.exit(1);
}

// Device pixels the compositor actually needs, derived from the live viewport.
const NEED_W = 1082;
const NEED_H = Math.round((NEED_W * 1881) / 836); // preserves the source ratio

const src = sharp(SRC).removeAlpha();
const { width: sw, height: sh } = await src.metadata();
const scale = NEED_W / sw;

/** High-frequency energy + clipping, on luminance. */
const metrics = async (buf) => {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    lum[i] = 0.2126 * data[i * 3] + 0.7152 * data[i * 3 + 1] + 0.0722 * data[i * 3 + 2];
  }
  // 4-neighbour Laplacian: mean absolute response tracks edge acutance.
  let e = 0, n = 0, clippedLo = 0, clippedHi = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      e += Math.abs(4 * lum[i] - lum[i - 1] - lum[i + 1] - lum[i - w] - lum[i + w]);
      n++;
    }
  }
  for (let i = 0; i < w * h; i++) {
    if (lum[i] <= 0.5) clippedLo++;
    if (lum[i] >= 254.5) clippedHi++;
  }
  return {
    sharp: e / n,
    clipLo: (clippedLo / (w * h)) * 100,
    clipHi: (clippedHi / (w * h)) * 100,
    w, h,
  };
};

const base = await src.resize(NEED_W, NEED_H, { kernel: sharp.kernel.lanczos3 }).png().toBuffer();

const CANDIDATES = [
  ["A  lanczos only", null],
  ["B  mild", { sigma: 0.6, m1: 0.6, m2: 1.0 }],
  ["C  moderate", { sigma: 0.8, m1: 1.0, m2: 1.6 }],
  ["D  strong", { sigma: 1.0, m1: 1.4, m2: 2.2 }],
];

console.log(`  source ${sw}x${sh} -> ${NEED_W}x${NEED_H}  (lanczos3, scale ${scale.toFixed(3)}x)`);
console.log(`  live viewport needs ~1081x2426 device px, so the browser no longer upscales\n`);

const srcM = await metrics(await src.png().toBuffer());
console.log(`  source (before any resize): edge energy ${srcM.sharp.toFixed(3)}\n`);

const results = [];
for (const [name, sh2] of CANDIDATES) {
  const img = sharp(base);
  if (sh2) img.sharpen(sh2);
  const png = await img.png().toBuffer();
  const m = await metrics(png);
  const webp = await sharp(png).webp({ quality: 90, effort: 6 }).toBuffer();
  const path = `${PREFIX}-${name[0]}.webp`;
  writeFileSync(path, webp);
  results.push({ name, m, webp, path, gain: ((m.sharp / srcM.sharp - 1) * 100) });
  console.log(
    `  ${name.padEnd(16)} edge ${m.sharp.toFixed(3)}  (+${((m.sharp / srcM.sharp - 1) * 100).toFixed(1)}% vs source)  ` +
      `clip lo ${m.clipLo.toFixed(3)}%  hi ${m.clipHi.toFixed(3)}%  ${(webp.length / 1024).toFixed(0)} KB`
  );
}

const a = results.find((r) => r.name.startsWith("A"));
console.log(`\n  clipping reference (lanczos, no sharpen): lo ${a.m.clipLo.toFixed(3)}%  hi ${a.m.clipHi.toFixed(3)}%`);
for (const r of results.slice(1)) {
  const dLo = r.m.clipLo - a.m.clipLo;
  const dHi = r.m.clipHi - a.m.clipHi;
  console.log(
    `  ${r.name.padEnd(16)} vs A: clip lo ${dLo >= 0 ? "+" : ""}${dLo.toFixed(3)}%  hi ${dHi >= 0 ? "+" : ""}${dHi.toFixed(3)}%  -> ` +
      `${dLo + dHi > 0.05 ? "some ringing" : "clean"}`
  );
}
console.log(`\n  wrote ${PREFIX}-{A,B,C,D}.webp`);
