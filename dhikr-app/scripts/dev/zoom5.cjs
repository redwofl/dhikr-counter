const sharp = require("sharp");
const path = require("path");

(async () => {
  const { data, info } = await sharp(path.join(process.env.TEMP, "opencode", "screen7.png")).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const region = (x0, y0, x1, y1, step) => {
    let out = "";
    for (let y = y0; y < y1; y += step) {
      let row = "";
      for (let x = x0; x < x1; x += step) {
        const i = (y * w + x) * 4;
        const r = data[i], g = data[i+1], b = data[i+2];
        const lum = (r + g + b) / 3;
        row += lum > 230 ? "#" : lum > 200 ? "+" : lum > 175 ? "=" : lum > 150 ? "-" : lum > 125 ? ":" : lum > 100 ? "," : ".";
      }
      out += row + "\n";
    }
    return out;
  };
  console.log(region(300, 620, 1200, 960, 4));
})();