const sharp = require("sharp");
const fs = require("fs");

(async () => {
  const { data, info } = await sharp(fs.readFileSync("public/eid-bg.jpg")).raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const bs = 24;
  let out = "";
  for (let y = 0; y < h; y += bs) {
    let row = "";
    for (let x = 0; x < w; x += bs) {
      let sr = 0, sg = 0, sb = 0, n = 0;
      for (let dy = 0; dy < bs; dy += 3) for (let dx = 0; dx < bs; dx += 3) {
        const i = ((y+dy)*w + (x+dx))*4;
        sr += data[i]; sg += data[i+1]; sb += data[i+2]; n++;
      }
      const r = sr/n, g = sg/n, b = sb/n;
      const lum = (r+g+b)/3;
      row += lum > 200 ? "#" : lum > 160 ? "+" : lum > 120 ? "=" : lum > 85 ? "-" : lum > 50 ? ":" : lum > 25 ? "," : ".";
    }
    out += row + "\n";
  }
  console.log(out);
})();