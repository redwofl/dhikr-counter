import sharp from "sharp";
import { writeFileSync } from "node:fs";

/**
 * Preview a candidate counter background before deploying it.
 *
 * Answers the question a plain mean/stdev cannot: after the real scrim is
 * composited and the text sits on top, is the lettering still legible? A
 * background can be a perfectly good image and still be unusable here, because
 * the text is fixed-size, fixed-position and drawn in known colours.
 *
 * The backdrop is rebuilt exactly as the app draws it — cover-fit into
 * 1080x2424, then --bg-scrim over it — and the real text colours are composited
 * into the real bounds measured off the live app. Light and dark are both
 * rendered, because --bg-scrim differs per theme and the two can disagree about
 * which parts of an image are too bright.
 *
 * The glyph blocks are drawn as rounded bars, not real type: this is a
 * legibility check, not a mockup. contrast2.mjs remains the authority for real
 * rendered text, since it isolates actual strokes.
 *
 * Usage: node bg-preview.mjs <source-image> [out-prefix]
 */

const [, , SRC, OUT = "./bg-preview"] = process.argv;
if (!SRC) {
  console.error("usage: node bg-preview.mjs <source-image> [out-prefix]");
  process.exit(1);
}

// 1080x2424 @ 420dpi, measured off the live emulator.
const W = 1080;
const H = 2424;

// --bg-scrim-light, verbatim from src/index.css.
const LIGHT = [
  [0, 0x00],
  [0.2, 0x0a],
  [0.4, 0x1f],
  [0.58, 0x3d],
  [0.76, 0x61],
  [1, 0x80],
];
// --bg-scrim-dark, verbatim from src/index.css.
const DARK = [
  [0, 0x80],
  [0.35, 0x94],
  [0.7, 0xad],
  [1, 0xc7],
];

// Real bounds from the live app (uiautomator), and the colour each element
// actually paints. --gold-lux's mid-tone is #C2913A; the dim translations are
// text-white/50, composited over the backdrop rather than assumed opaque.
const TEXT = [
  ["arabic-gold", 173, 474, 908, 700, "#C2913A", 1.0],
  ["translit-90", 170, 703, 910, 779, "#FFFFFF", 0.9],
  ["translit-50", 170, 876, 910, 934, "#FFFFFF", 0.5],
  ["template-name", 343, 1131, 737, 1186, "#FFFFFF", 1.0],
  ["set-max", 430, 2060, 651, 2105, "#FFFFFF", 0.7],
];

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const gradientSvg = (stops) =>
  Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs>` +
      `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1">` +
      stops
        .map(([p, a]) => `<stop offset="${p}" stop-color="#000000" stop-opacity="${(a / 255).toFixed(4)}"/>`)
        .join("") +
      `</linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/></svg>`
  );

const lum = (r, g, b) => {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const src = sharp(SRC).removeAlpha();
const { width: sw, height: sh } = await src.metadata();

// cover: scale until both axes are covered, then centre-crop the overflow.
const scale = Math.max(W / sw, H / sh);
const full = await src.resize(Math.round(sw * scale), Math.round(sh * scale), { fit: "fill" }).toBuffer();
const fw = Math.round(sw * scale);
const fh = Math.round(sh * scale);
const cropped = await sharp(full)
  .extract({
    left: Math.max(0, Math.floor((fw - W) / 2)),
    top: Math.max(0, Math.floor((fh - H) / 2)),
    width: Math.min(W, fw),
    height: Math.min(H, fh),
  })
  .toBuffer();

console.log(`  source ${sw}x${sh} -> cover ${W}x${H}  (scale ${scale.toFixed(3)}, centre-cropped)`);

for (const [theme, stops] of [
  ["light", LIGHT],
  ["dark", DARK],
]) {
  const base = await sharp(cropped).composite([{ input: gradientSvg(stops), blend: "over" }]).toBuffer();
  const { data, info } = await sharp(base).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => {
    const i = (Math.min(info.height - 1, y) * info.width + Math.min(info.width - 1, x)) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const bars = TEXT.map(([label, x1, y1, x2, y2, hex, alpha]) => {
    const [r, g, b] = hexToRgb(hex);
    const h = (y2 - y1) * 0.42;
    return {
      label,
      x1, y1, x2, y2, alpha,
      svg: `<rect x="${x1 + 8}" y="${y1}" width="${x2 - x1 - 16}" height="${Math.round(h)}" rx="${Math.round(h / 2)}" fill="rgb(${r},${g},${b})" opacity="${alpha}"/>`,
    };
  });

  const out = await sharp(base)
    .composite([
      {
        input: Buffer.from(
          `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${bars.map((b) => b.svg).join("")}</svg>`
        ),
        blend: "over",
      },
    ])
    .png()
    .toBuffer();
  const path = `${OUT}-${theme}.png`;
  writeFileSync(path, out);

  console.log(`\n  --- ${theme} ---`);
  for (const t of TEXT) {
    const [label, x1, y1, x2, y2, hex, alpha] = t;
    const [tr, tg, tb] = hexToRgb(hex);
    const bgPix = at(Math.round((x1 + x2) / 2), Math.max(0, y1 - 6));
    const comp = [0, 1, 2].map((i) => [tr, tg, tb][i] * alpha + bgPix[i] * (1 - alpha));
    const r = ratio(lum(comp[0], comp[1], comp[2]), lum(bgPix[0], bgPix[1], bgPix[2]));
    const verdict = r >= 4.5 ? "PASS AA" : r >= 3 ? "large-text only" : "FAIL";
    console.log(
      `    ${label.padEnd(14)} bg=rgb(${bgPix.join(",")})  text=rgb(${comp.map(Math.round).join(",")})  ` +
        `contrast=${r.toFixed(2)}:1  ${verdict}`
    );
  }
  console.log(`    wrote ${path}`);
}
