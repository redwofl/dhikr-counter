const sharp = require("sharp");
const path = require("path");

(async () => {
  const { data, info } = await sharp(path.join(process.env.TEMP, "opencode", "screen7.png")).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const bs = 24;
  let out = "";
  for (let y = 0; y < h; y += bs) {
    let row = "";
    for (let x = 0; x < w; x += bs) {
      let sr = 0, sg = 0, sb = 0, n = 0;
      for (let dy = 0; dy < bs; dy += 4) for (let dx = 0; dx < bs; dx += 4) {
        const i = ((y+dy)*w+(x+dx))*4;
        sr += data[i]; sg += data[i+1]; sb += data[i+2]; n++;
      }
      const r = sr/n, g = sg/n, b = sb/n;
      const lum = (r+g+b)/3;
      row += lum > 210 ? "#" : lum > 180 ? "+" : lum > 150 ? "=" : lum > 120 ? "-" : lum > 95 ? ":" : lum > 70 ? "," : ".";
    }
    out += row + ` ${y}\n`;
  }
  console.log(out);
})();