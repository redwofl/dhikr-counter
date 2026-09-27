const sharp = require("sharp");
const path = require("path");

(async () => {
  const src = path.join("public", "counter-bg-custom.png");
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;

  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = data[i * 4 + 3];

  const FEATHER = 5;
  for (let x = 0; x < w; x++) {
    let top = -1;
    for (let y = 0; y < h; y++) {
      if (alpha[y * w + x] >= 128) { top = y; break; }
    }
    if (top < 0) continue;
    for (let y = 0; y < h; y++) {
      if (y < top - FEATHER || y > top + FEATHER) continue;
      const k = Math.max(0, (y - (top - FEATHER)) / (FEATHER * 2));
      const v = Math.round(k * Math.min(255, alpha[y * w + x]));
      if (y >= top) data[(y * w + x) * 4 + 3] = v;

      data[(y * w + x) * 4 + 3] = Math.max(y >= top ? v : 0, 0);
    }
  }

  for (let i = 0; i < w * h; i++) {
    if (alpha[i] >= 128) {
      // topmost row T was found; interior untouched
    }
  }

  const out = Buffer.from(data);
  await sharp(out, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toFile(src + ".feathered.png");

  const { data: ck, info: cki } = await sharp(src + ".feathered.png").ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  console.log("origin size", w, h, "out size", cki.width, cki.height);
  for (let y = 568; y < 596; y += 2) {
    let s = "";
    for (let x = 420; x < 720; x += 10) {
      const i = (y * w + x) * 4;
      s += ck[i + 3] > 240 ? "#" : ck[i + 3] > 120 ? "=" : ck[i + 3] > 10 ? ":" : ".";
    }
    console.log(y + ": " + s);
  }
})();