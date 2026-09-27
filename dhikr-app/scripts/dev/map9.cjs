const sharp = require("sharp");
const path = require("path");

(async () => {
  const { data, info } = await sharp(path.join(process.env.TEMP, "opencode", "screen9b.png")).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const bs = 20;
  for (let y = 760; y < 1540; y += bs) {
    let row = "";
    for (let x = 160; x < 1240; x += bs) {
      let s = 0, n = 0;
      for (let dy = 0; dy < bs; dy += 5) for (let dx = 0; dx < bs; dx += 5) {
        const i = ((y + dy) * w + (x + dx)) * 4;
        s += data[i] + data[i + 1] + data[i + 2]; n += 3;
      }
      const l = s / n;
      row += l > 225 ? "#" : l > 200 ? "+" : l > 175 ? "=" : l > 145 ? "-" : l > 115 ? ":" : l > 85 ? "," : ".";
    }
    console.log(row + "  y=" + y);
  }
})();