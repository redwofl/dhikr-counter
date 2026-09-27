const sharp = require("sharp");
const path = require("path");

(async () => {
  const { data, info } = await sharp(path.join(process.env.TEMP, "opencode", "screen7.png")).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  // very fine zoom right under the Arabic (y 655-800), x 560-1000
  for (let y = 646; y < 806; y += 2) {
    let row = "";
    for (let x = 560; x < 1000; x += 2) {
      const i = (y * w + x) * 4;
      const r = data[i], g = data[i+1], b = data[i+2];
      const lum = (r + g + b) / 3;
      row += lum > 215 ? "#" : lum > 185 ? "+" : lum > 160 ? "=" : lum > 140 ? "-" : lum > 120 ? ":" : lum > 100 ? "," : ".";
    }
    console.log(row);
  }
})();