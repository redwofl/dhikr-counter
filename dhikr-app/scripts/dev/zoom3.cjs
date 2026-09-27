const sharp = require("sharp");
const path = require("path");

(async () => {
  const { data, info } = await sharp(path.join(process.env.TEMP, "opencode", "screen5.png")).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const region = (x0, y0, x1, y1, step) => {
    let out = ``;
    for (let y = y0; y < y1; y += step) {
      let row = "";
      for (let x = x0; x < x1; x += step) {
        const i = (y * w + x) * 4;
        const r = data[i], g = data[i+1], b = data[i+2];
        const lum = 0.299*r+0.587*g+0.114*b;
        row += lum > 225 ? "#" : lum > 190 ? "+" : lum > 160 ? "=" : lum > 140 ? "-" : lum > 100 ? ":" : ".";
      }
      out += row + "\n";
    }
    return out;
  };
  console.log(region(0, 300, 1280, 560, 8));
  console.log("===== 560-760 =====");
  console.log(region(0, 560, 1280, 760, 8));
})();