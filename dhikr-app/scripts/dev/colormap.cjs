const sharp = require("sharp");
const path = require("path");

(async () => {
  const { data, info } = await sharp(path.join(process.env.TEMP, "opencode", "screen5.png")).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const bs = 56;
  const cols = Math.ceil(w / bs), rows = Math.ceil(h / bs);
  const key = {};
  const names = ["w", "b3", ".", "#", "+", "="];
  // char by dominant tone: brown wall->"w", dark->".", light gray/white->"#", gold->"G", other
  let out = "";
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      const x0 = c * bs, x1 = Math.min(x0 + bs, w);
      const y0 = r * bs, y1 = Math.min(y0 + bs, h);
      let sr = 0, sg = 0, sb = 0, n = 0;
      for (let y = y0; y < y1; y += 8) {
        for (let x = x0; x < x1; x += 8) {
          const i = (y * w + x) * 4;
          sr += data[i]; sg += data[i+1]; sb += data[i+2]; n++;
        }
      }
      sr = sr / n; sg = sg / n; sb = sb / n;
      let ch;
      const lum = 0.299 * sr + 0.587 * sg + 0.114 * sb;
      if (lum < 60) ch = ".";
      else if (sr > sg + 15 && sr > sb + 15) ch = "w";
      else if (sg > sr + 12 && sg > sb + 12) ch = "%";
      else if (sb > sr + 12 && sb > rg2) ch = "@";
      else if (lum > 200) ch = "#";
      else if (lum > 150) ch = "+";
      else if (lum > 90) ch = "=";
      else ch = ":";
      key[ch] = (key[ch] || 0) + 1;
      line += ch;
    }
    out += line + "\n";
  }
  console.log(out);
  console.log(JSON.stringify(key));
})();