import sharp from "sharp";

/**
 * Measure text contrast for a candidate background, using the app's real paint.
 *
 * This exists because the first attempt got it wrong in a way that looked like a
 * serious accessibility regression: it stretched each candidate to the viewport
 * with `fit: "fill"`, which forced a 1:1 stretch instead of cover-fitting. The
 * photo then slid vertically relative to the fixed text bounds, so the gold
 * measured 1.25:1 and "Set Max Count" measured 2.38:1 — against 9.65:1 for the
 * live app on the very same image. Nothing had changed; the backdrop under each
 * label was simply the wrong part of the picture.
 *
 * So this cover-fits exactly like CSS: scale until both axes are covered, then
 * centre-crop the overflow, then composite --bg-scrim over it. That reproduces
 * the deployed pipeline (see vite/Capacitor serving the file at
 * background-size:cover; background-position:center) instead of approximating it.
 *
 * Usage: node bg-contrast.mjs <image> ["label,x1,y1,x2,y2,#hex,alpha" ...]
 */

const lum = (r, g, b) => {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// The live WebView viewport, in device px (412x924 CSS at 2.625 dpr).
const W = 1081;
const H = 2426;

// --bg-scrim-light, verbatim from src/index.css.
const LIGHT = [
  [0, 0x00],
  [0.2, 0x0a],
  [0.4, 0x1f],
  [0.58, 0x3d],
  [0.76, 0x61],
  [1, 0x80],
];

const scrimSvg = (stops, w, h) =>
  Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs>` +
      `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
      stops.map(([p, a]) => `<stop offset="${p}" stop-color="#000000" stop-opacity="${(a / 255).toFixed(4)}"/>`).join("") +
      `</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`
  );

const file = process.argv[2];
const specs = process.argv.slice(3);
if (!file || !specs.length) {
  console.error('usage: node bg-contrast.mjs <image> "label,x1,y1,x2,y2,#hex,alpha" [...]');
  process.exit(1);
}

const src = sharp(file).removeAlpha();
const { width: sw, height: sh } = await src.metadata();

// cover, then centre-crop — the same as background-size:cover + position:center
const scale = Math.max(W / sw, H / sh);
const fw = Math.round(sw * scale);
const fh = Math.round(sh * scale);
const left = Math.max(0, Math.floor((fw - W) / 2));
const top = Math.max(0, Math.floor((fh - H) / 2));
const cw = Math.min(W, fw);
const ch = Math.min(H, fh);

const full = await src.resize(fw, fh, { fit: "fill" }).toBuffer();
const painted = await sharp(full)
  .extract({ left, top, width: cw, height: ch })
  .composite([{ input: scrimSvg(LIGHT, cw, ch), blend: "over" }])
  .png()
  .toBuffer();

const { data, info } = await sharp(painted).removeAlpha().raw().toBuffer({ resolveWithObject: true });
console.log(
  `  ${file.split(/[\\/]/).pop()}  ${sw}x${sh} -> cover ${cw}x${ch} at +${left},+${top} (scale ${scale.toFixed(3)})\n`
);

for (const spec of specs) {
  const [label, x1, y1, x2, y2, hex, alpha] = spec.split(",");
  const [tr, tg, tb] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const a = +alpha;
  const cx = Math.round((+x1 + +x2) / 2);
  const cy = Math.max(0, +y1 - 6);
  const i = (Math.min(info.height - 1, cy) * info.width + Math.min(info.width - 1, cx)) * 3;
  const bg = [data[i], data[i + 1], data[i + 2]];
  const fg = [0, 1, 2].map((k) => [tr, tg, tb][k] * a + bg[k] * (1 - a));
  const r = ratio(lum(...fg), lum(...bg));
  const verdict = r >= 4.5 ? "PASS AA" : r >= 3 ? "large-text only" : "FAIL";
  console.log(
    `    ${label.padEnd(14)} bg=rgb(${bg.join(",")})  text=rgb(${fg.map(Math.round).join(",")})  ` +
      `contrast=${r.toFixed(2)}:1  ${verdict}`
  );
}
