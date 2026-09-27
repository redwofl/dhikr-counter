const sharp = require("sharp");

(async () => {
  const file = process.argv[2];
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const region = (x0, y0, x1, y1, step) => {
    let out = `${x0},${y0}->${x1},${y1}\n`;
    for (let y = y0; y < y1; y += step) {
      let row = "";
      for (let x = x0; x < x1; x += step) {
        const i = (y * w + x) * 4;
        const r = data[i], g = data[i+1], b = data[i+2];
        row += `#${((r>>4)<<8)|((g>>4)<<4)|(b>>4)}`.slice(1).slice(0,3);
      }
      out += row + "\n";
    }
    return out;
  };
  console.log(region(300, 690, 1220, 780, 4));
  console.log(region(300, 1130, 1220, 1210, 4));
})();