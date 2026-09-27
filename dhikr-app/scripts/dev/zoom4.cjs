const sharp = require("sharp");
const path = require("path");

(async () => {
  const { data, info } = await sharp(path.join(process.env.TEMP, "opencode", "screen5.png")).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const region = (x0, y0, x1, y1, step) => {
    let out = "";
    for (let y = y0; y < y1; y += step) {
      let row = "";
      for (let x = x0; x < x1; x += step) {
        const i = (y * w + x) * 4;
        const r = data[i], g = data[i+1], b = data[i+2];
        const lum = (r + g + b) / 3;
        row += lum > 235 ? "#" : lum > 220 ? "+" : lum > 200 ? "=" : lum > 175 ? "-" : lum > 145 ? ":" : lum > 110 ? "," : ".";
      }
      out += row + "\n";
    }
    return out;
  };
  console.log(region(300, 660, 1200, 1400, 6));
})();