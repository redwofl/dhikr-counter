// Generate a seamlessly tileable film-grain tile.
// Mirroring a 64x64 noise patch into 128x128 makes it tile with no visible seam,
// so there is no repeating grid and no hard edge anywhere in the texture.
import sharp from "sharp";

const N = 64;          // source patch
const OUT = N * 2;     // mirrored tile
const MAX_ALPHA = 22;  // very subtle: grain, not texture

// deterministic PRNG so the asset is reproducible
let seed = 20260927;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

// Float32Array, not Uint8Array: a byte array would truncate the 0..1 floats
// to 0 or 1 and flatten the grain into a single solid alpha.
const patch = new Float32Array(N * N);
for (let i = 0; i < N * N; i++) patch[i] = rnd();

const buf = Buffer.alloc(OUT * OUT * 4);
for (let y = 0; y < OUT; y++) {
  const sy = y < N ? y : OUT - 1 - y;          // mirror vertically
  for (let x = 0; x < OUT; x++) {
    const sx = x < N ? x : OUT - 1 - x;        // mirror horizontally
    const v = patch[sy * N + sx];
    const o = (y * OUT + x) * 4;
    // push midtones toward the ends so the grain is fine, not blotchy
    const t = (v - 0.5) * 2;
    if (t >= 0) {
      buf[o] = 255; buf[o + 1] = 255; buf[o + 2] = 255;
      buf[o + 3] = Math.round(t * MAX_ALPHA);
    } else {
      buf[o] = 0; buf[o + 1] = 0; buf[o + 2] = 0;
      buf[o + 3] = Math.round(-t * MAX_ALPHA);
    }
  }
}

const out = "public/bg-grain.png";
await sharp(buf, { raw: { width: OUT, height: OUT, channels: 4 } })
  .png({ compressionLevel: 9, palette: false })
  .toFile(out);

const md = await sharp(out).metadata();
console.log(`wrote ${out}  ${md.width}x${md.height}  alpha=${!!md.hasAlpha}`);
