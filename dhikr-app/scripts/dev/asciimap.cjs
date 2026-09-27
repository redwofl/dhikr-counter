const sharp = require("sharp");

(async () => {
  const { data, info } = await sharp(process.argv[2])
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width, c = info.channels;
  const X0 = 200, X1 = 1150, Y0 = 560, Y1 = 860;
  const COLS = 95, ROWS = 30;
  const cw = (X1 - X0) / COLS, ch = (Y1 - Y0) / ROWS;
  let out = "";
  for (let br = 0; br < ROWS; br++) {
    let row = "";
    for (let bc = 0; bc < COLS; bc++) {
      let ink = 0, n = 0;
      for (let y = Math.round(Y0 + br * ch); y < Math.round(Y0 + (br + 1) * ch); y += 1) {
        for (let x = Math.round(X0 + bc * cw); x < Math.round(X0 + (bc + 1) * cw); x += 1) {
          const i = (y * w + x) * c;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const lum = r + g + b;
          if (lum > 395 || (r > 118 && g > 78 && b < 75 && r > g + 22)) ink++;
          n++;
        }
      }
      const frac = ink / n;
      let ch2 = ".";
      if (frac > 0.30) ch2 = "#";
      else if (frac > 0.14) ch2 = "+";
      else if (frac > 0.05) ch2 = ":";
      row += ch2;
    }
    out += row + "\n";
  }
  console.log(out);
  console.log(`y ${Y0}-${Y1} x ${X0}-${X1}`);
})();