const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

(async () => {
  const { data: img, info } = await sharp(fs.readFileSync("public/counter-bg-custom.png")).raw().toBuffer({ resolveWithObject: true });
  const iw = info.width, ih = info.height;
  // Colormap: avg alpha per 21px block across whole image
  let rows = [];
  const bs = 21;
  for (let y = 0; y < ih; y += bs) {
    let line = "";
    for (let x = 0; x < iw; x += bs) {
      let s = 0, n = 0;
      for (let dy = 0; dy < bs; dy++) for (let dx = 0; dx < bs; dx++) {
        s += img[((y + dy) * iw + (x + dx)) * 4 + 3]; n++;
      }
      const a = s / n;
      line += a > 200 ? "#" : a > 120 ? "+" : a > 50 ? "-" : a > 12 ? ":" : ".";
    }
    rows.push(line);
  }
  console.log(rows.join("\n"));
})();